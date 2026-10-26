
from datetime import date
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles


router = APIRouter(
    prefix="/advance-payments",
    tags=["Advance Payments"],
)


class AdvanceCreate(BaseModel):
    employee_id: UUID
    requested_amount: Decimal = Field(
        gt=0, max_digits=12, decimal_places=2
    )
    reason: str = Field(min_length=1, max_length=1000)


class AdvanceApproval(BaseModel):
    approved_amount: Decimal | None = Field(
        default=None, gt=0, max_digits=12, decimal_places=2
    )


class AdvanceRejection(BaseModel):
    rejection_reason: str = Field(min_length=1, max_length=1000)


class DisbursementCreate(BaseModel):
    amount: Decimal = Field(
        gt=0, max_digits=12, decimal_places=2
    )


class RepaymentCreate(BaseModel):
    amount: Decimal = Field(
        gt=0, max_digits=12, decimal_places=2
    )
    repayment_date: date | None = None
    notes: str | None = Field(default=None, max_length=1000)


def get_advance_for_update(db: Session, advance_id: UUID, company_id):
    """Lock one advance row while validating a state-changing operation."""
    advance = db.execute(
        text("""
            SELECT *
            FROM employee_salary_advances
            WHERE id = :advance_id
              AND company_id = :company_id
            FOR UPDATE
        """),
        {
            "advance_id": advance_id,
            "company_id": company_id,
        },
    ).mappings().first()

    if not advance:
        raise HTTPException(status_code=404, detail="Advance not found.")

    return advance


@router.get("/employees")
def list_advance_employees(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("ADMIN", "ACCOUNTANT")
    ),
):
    """List active employees in the current company."""
    rows = db.execute(
        text("""
            SELECT id, employee_code, full_name, department_id,
                   designation, salary_type
            FROM employees
            WHERE company_id = :company_id
              AND is_active = TRUE
            ORDER BY full_name
        """),
        {"company_id": current_user["company_id"]},
    ).mappings().all()

    return [dict(row) for row in rows]


@router.post("")
def create_advance(
    payload: AdvanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    """Create a pending advance request on behalf of an employee."""
    company_id = current_user["company_id"]

    employee = db.execute(
        text("""
            SELECT id
            FROM employees
            WHERE id = :employee_id
              AND company_id = :company_id
              AND is_active = TRUE
        """),
        {
            "employee_id": payload.employee_id,
            "company_id": company_id,
        },
    ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Active employee not found in this company.",
        )

    try:
        row = db.execute(
            text("""
                INSERT INTO employee_salary_advances (
                    company_id,
                    employee_id,
                    requested_amount,
                    reason,
                    requested_by,
                    status
                )
                VALUES (
                    :company_id,
                    :employee_id,
                    :requested_amount,
                    :reason,
                    :requested_by,
                    'PENDING'
                )
                RETURNING *
            """),
            {
                "company_id": company_id,
                "employee_id": payload.employee_id,
                "requested_amount": payload.requested_amount,
                "reason": payload.reason.strip(),
                "requested_by": current_user["id"],
            },
        ).mappings().one()

        db.commit()
        return dict(row)

    except Exception:
        db.rollback()
        raise


@router.get("")
def list_advances(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("ADMIN", "ACCOUNTANT")
    ),
):
    """List advances and calculate outstanding balances."""
    rows = db.execute(
        text("""
            SELECT
                a.id,
                a.employee_id,
                e.employee_code,
                e.full_name AS employee_name,
                a.requested_amount,
                a.approved_amount,
                a.disbursed_amount,
                a.reason,
                a.status,
                a.requested_by,
                a.approved_by,
                a.approved_at,
                a.rejected_by,
                a.rejected_at,
                a.rejection_reason,
                a.disbursed_by,
                a.disbursed_at,
                a.created_at,
                COALESCE(r.total_repaid, 0) AS total_repaid,
                a.disbursed_amount
                    - COALESCE(r.total_repaid, 0) AS outstanding_balance
            FROM employee_salary_advances a
            JOIN employees e
              ON e.id = a.employee_id
             AND e.company_id = a.company_id
            LEFT JOIN (
                SELECT advance_id, company_id, SUM(amount) AS total_repaid
                FROM employee_advance_repayments
                GROUP BY advance_id, company_id
            ) r
              ON r.advance_id = a.id
             AND r.company_id = a.company_id
            WHERE a.company_id = :company_id
            ORDER BY a.created_at DESC
        """),
        {"company_id": current_user["company_id"]},
    ).mappings().all()

    return [dict(row) for row in rows]


@router.post("/{advance_id}/approve")
def approve_advance(
    advance_id: UUID,
    payload: AdvanceApproval,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("ADMIN", "ACCOUNTANT")
    ),
):
    company_id = current_user["company_id"]

    try:
        advance = get_advance_for_update(db, advance_id, company_id)

        if advance["status"] != "PENDING":
            raise HTTPException(
                status_code=409,
                detail="Only pending advances can be approved.",
            )

        approved_amount = (
            payload.approved_amount
            if payload.approved_amount is not None
            else advance["requested_amount"]
        )

        if approved_amount > advance["requested_amount"]:
            raise HTTPException(
                status_code=400,
                detail="Approved amount cannot exceed requested amount.",
            )

        row = db.execute(
            text("""
                UPDATE employee_salary_advances
                SET approved_amount = :approved_amount,
                    approved_by = :approved_by,
                    approved_at = NOW(),
                    status = 'APPROVED',
                    updated_at = NOW()
                WHERE id = :advance_id
                  AND company_id = :company_id
                RETURNING *
            """),
            {
                "approved_amount": approved_amount,
                "approved_by": current_user["id"],
                "advance_id": advance_id,
                "company_id": company_id,
            },
        ).mappings().one()

        db.commit()
        return dict(row)

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.post("/{advance_id}/reject")
def reject_advance(
    advance_id: UUID,
    payload: AdvanceRejection,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("ADMIN", "ACCOUNTANT")
    ),
):
    company_id = current_user["company_id"]

    try:
        advance = get_advance_for_update(db, advance_id, company_id)

        if advance["status"] != "PENDING":
            raise HTTPException(
                status_code=409,
                detail="Only pending advances can be rejected.",
            )

        row = db.execute(
            text("""
                UPDATE employee_salary_advances
                SET status = 'REJECTED',
                    rejected_by = :rejected_by,
                    rejected_at = NOW(),
                    rejection_reason = :rejection_reason,
                    updated_at = NOW()
                WHERE id = :advance_id
                  AND company_id = :company_id
                RETURNING *
            """),
            {
                "rejected_by": current_user["id"],
                "rejection_reason": payload.rejection_reason.strip(),
                "advance_id": advance_id,
                "company_id": company_id,
            },
        ).mappings().one()

        db.commit()
        return dict(row)

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.post("/{advance_id}/disburse")
def disburse_advance(
    advance_id: UUID,
    payload: DisbursementCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("ADMIN", "ACCOUNTANT")
    ),
):
    """Record money actually paid out; supports multiple disbursements."""
    company_id = current_user["company_id"]

    try:
        advance = get_advance_for_update(db, advance_id, company_id)

        if advance["status"] not in ("APPROVED", "DISBURSED"):
            raise HTTPException(
                status_code=409,
                detail="Only approved advances can be disbursed.",
            )

        remaining_to_disburse = (
            advance["approved_amount"] - advance["disbursed_amount"]
        )

        if payload.amount > remaining_to_disburse:
            raise HTTPException(
                status_code=400,
                detail="Disbursement exceeds the approved amount remaining.",
            )

        new_disbursed = advance["disbursed_amount"] + payload.amount
        fully_disbursed = new_disbursed == advance["approved_amount"]

        row = db.execute(
            text("""
                UPDATE employee_salary_advances
                SET disbursed_amount = :disbursed_amount,
                    disbursed_by = :disbursed_by,
                    disbursed_at = NOW(),
                    status = :status,
                    updated_at = NOW()
                WHERE id = :advance_id
                  AND company_id = :company_id
                RETURNING *
            """),
            {
                "disbursed_amount": new_disbursed,
                "disbursed_by": current_user["id"],
                "status": "DISBURSED" if fully_disbursed else "APPROVED",
                "advance_id": advance_id,
                "company_id": company_id,
            },
        ).mappings().one()

        db.commit()
        return dict(row)

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.post("/{advance_id}/repayments")
def record_repayment(
    advance_id: UUID,
    payload: RepaymentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("ADMIN", "ACCOUNTANT")
    ),
):
    """Record a manual repayment without exceeding the disbursed balance."""
    company_id = current_user["company_id"]

    try:
        advance = get_advance_for_update(db, advance_id, company_id)

        if advance["status"] not in ("DISBURSED", "CLOSED"):
            raise HTTPException(
                status_code=409,
                detail="Repayments require a fully disbursed advance.",
            )

        total_repaid = db.execute(
            text("""
                SELECT COALESCE(SUM(amount), 0)
                FROM employee_advance_repayments
                WHERE advance_id = :advance_id
                  AND company_id = :company_id
            """),
            {
                "advance_id": advance_id,
                "company_id": company_id,
            },
        ).scalar_one()

        outstanding = advance["disbursed_amount"] - total_repaid

        if outstanding <= 0 or advance["status"] == "CLOSED":
            raise HTTPException(
                status_code=409,
                detail="This advance has already been fully repaid.",
            )

        if payload.amount > outstanding:
            raise HTTPException(
                status_code=400,
                detail="Repayment cannot exceed the outstanding balance.",
            )

        repayment_date = payload.repayment_date or date.today()

        row = db.execute(
            text("""
                INSERT INTO employee_advance_repayments (
                    company_id,
                    advance_id,
                    amount,
                    repayment_date,
                    notes,
                    recorded_by
                )
                VALUES (
                    :company_id,
                    :advance_id,
                    :amount,
                    :repayment_date,
                    :notes,
                    :recorded_by
                )
                RETURNING *
            """),
            {
                "company_id": company_id,
                "advance_id": advance_id,
                "amount": payload.amount,
                "repayment_date": repayment_date,
                "notes": payload.notes,
                "recorded_by": current_user["id"],
            },
        ).mappings().one()

        new_total_repaid = total_repaid + payload.amount

        if new_total_repaid == advance["disbursed_amount"]:
            db.execute(
                text("""
                    UPDATE employee_salary_advances
                    SET status = 'CLOSED',
                        updated_at = NOW()
                    WHERE id = :advance_id
                      AND company_id = :company_id
                """),
                {
                    "advance_id": advance_id,
                    "company_id": company_id,
                },
            )

        db.commit()
        return dict(row)

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


@router.get("/{advance_id}/repayments")
def list_repayments(
    advance_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("ADMIN", "ACCOUNTANT")
    ),
):
    company_id = current_user["company_id"]

    # Verify the advance belongs to the current company.
    get_advance = db.execute(
        text("""
            SELECT id
            FROM employee_salary_advances
            WHERE id = :advance_id
              AND company_id = :company_id
        """),
        {
            "advance_id": advance_id,
            "company_id": company_id,
        },
    ).first()

    if not get_advance:
        raise HTTPException(status_code=404, detail="Advance not found.")

    rows = db.execute(
        text("""
            SELECT id, advance_id, amount, repayment_date,
                   notes, recorded_by, created_at
            FROM employee_advance_repayments
            WHERE advance_id = :advance_id
              AND company_id = :company_id
            ORDER BY repayment_date DESC, created_at DESC
        """),
        {
            "advance_id": advance_id,
            "company_id": company_id,
        },
    ).mappings().all()

    return [dict(row) for row in rows]
