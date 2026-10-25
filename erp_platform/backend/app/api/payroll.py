
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user


router = APIRouter(
    prefix="/payroll",
    tags=["Payroll"],
)


def validate_date_range(
    start_date: date | None,
    end_date: date | None,
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date cannot be after end_date.",
        )


def build_date_filter(
    start_date: date | None,
    end_date: date | None,
):
    conditions = []
    params = {}

    if start_date:
        conditions.append("w.work_date >= :start_date")
        params["start_date"] = start_date

    if end_date:
        conditions.append("w.work_date <= :end_date")
        params["end_date"] = end_date

    date_filter = ""
    if conditions:
        date_filter = " AND " + " AND ".join(conditions)

    return date_filter, params


@router.get("/employee-earnings")
def get_employee_earnings(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Summarize approved piece-rate earnings by employee."""

    validate_date_range(start_date, end_date)

    date_filter, params = build_date_filter(
        start_date,
        end_date,
    )
    params["company_id"] = current_user["company_id"]

    query = text(f"""
        SELECT
            e.id AS employee_id,
            e.full_name AS employee_name,
            COUNT(w.id) AS approved_work_records,
            COALESCE(
                SUM(w.quantity_accepted),
                0
            ) AS total_approved_pieces,
            COALESCE(
                SUM(
                    COALESCE(w.quantity_accepted, 0)
                    * w.rate_per_piece
                ),
                0
            ) AS total_earnings
        FROM employee_piece_work w
        JOIN employees e
          ON e.id = w.employee_id
         AND e.company_id = w.company_id
        WHERE w.company_id = :company_id
          AND w.verification_status = 'APPROVED'
          AND w.pay_type = 'piece_rate'
          {date_filter}
        GROUP BY e.id, e.full_name
        ORDER BY e.full_name
    """)

    rows = db.execute(query, params).mappings().all()

    return {
        "start_date": start_date,
        "end_date": end_date,
        "employees": [dict(row) for row in rows],
    }


@router.get("/period-details")
def get_payroll_period_details(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    employee_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List approved piece-rate work and calculated earnings."""

    validate_date_range(start_date, end_date)

    date_filter, params = build_date_filter(
        start_date,
        end_date,
    )
    params["company_id"] = current_user["company_id"]

    employee_filter = ""
    if employee_id:
        employee_filter = " AND w.employee_id = :employee_id"
        params["employee_id"] = employee_id

    query = text(f"""
        SELECT
            w.id AS work_id,
            w.employee_id,
            e.full_name AS employee_name,
            w.work_date,
            w.operation_id,
            o.operation_name,
            w.quantity_completed,
            w.quantity_accepted,
            w.rate_per_piece,
            (
                COALESCE(w.quantity_accepted, 0)
                * w.rate_per_piece
            ) AS calculated_earnings,
            w.verified_at
        FROM employee_piece_work w
        JOIN employees e
          ON e.id = w.employee_id
         AND e.company_id = w.company_id
        LEFT JOIN production_operations o
          ON o.id = w.operation_id
        WHERE w.company_id = :company_id
          AND w.verification_status = 'APPROVED'
          AND w.pay_type = 'piece_rate'
          {date_filter}
          {employee_filter}
        ORDER BY w.work_date DESC, e.full_name
    """)

    rows = db.execute(query, params).mappings().all()

    return {
        "start_date": start_date,
        "end_date": end_date,
        "records": [dict(row) for row in rows],
    }

