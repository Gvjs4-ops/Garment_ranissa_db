from datetime import date
from decimal import Decimal
from uuid import UUID
from datetime import date
from pydantic import BaseModel, Field
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
import logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/production",
    tags=["Production"],
)

class AssignmentUpdate(BaseModel):
    target_quantity: float = Field(gt=0)
    due_date: date | None = None
    pay_type: str
    agreed_rate: float = Field(ge=0)

class UpdateProductionRequirement(BaseModel):
    required_quantity: int = Field(gt=0)

@router.get("/requirements")
def get_production_requirements(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List production requirements belonging to the active company."""

    query = text("""
        SELECT
          a.id,
          a.production_requirement_id,
          a.employee_id,
          e.employee_code,
          e.full_name AS employee_name,
          a.operation_id,
          o.operation_code,
          o.operation_name,
          a.target_quantity,
          a.due_date,
          a.pay_type,
          a.agreed_rate,
          a.status,
          a.created_at,
          pr.sales_order_id,
          pr.sales_order_item_id,
          so.order_number,
          pr.required_quantity,
          pr.produced_quantity
        FROM employee_task_assignments a
        JOIN employees e
          ON e.id = a.employee_id
         AND e.company_id = a.company_id
        JOIN production_operations o
          ON o.id = a.operation_id
         AND o.company_id = a.company_id
        JOIN production_requirements pr
          ON pr.id = a.production_requirement_id
         AND pr.company_id = a.company_id
        JOIN sales_orders so
          ON so.id = pr.sales_order_id
         AND so.company_id = pr.company_id
        WHERE a.company_id = :company_id
        ORDER BY a.created_at DESC
    """)

    try:
        rows = db.execute(
            query,
            {"company_id": current_user["company_id"]},
        ).mappings().all()

        return [dict(row) for row in rows]

    except Exception as e:
        print("Error fetching production requirements:", e)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch production requirements",
        )

@router.patch("/requirements/{requirement_id}")
def update_production_requirement(
    requirement_id: str,
    payload: UpdateProductionRequirement,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update an eligible production requirement for the active company."""

    company_id = current_user["company_id"]

    try:
        existing = db.execute(
            text("""
                SELECT id, required_quantity, produced_quantity, status
                FROM production_requirements
                WHERE id = :requirement_id
                  AND company_id = :company_id
            """),
            {
                "requirement_id": requirement_id,
                "company_id": company_id,
            },
        ).mappings().first()

        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Production requirement not found",
            )

        if existing["status"] in ("COMPLETED", "CANCELLED"):
            raise HTTPException(
                status_code=400,
                detail="Completed or cancelled requirements cannot be edited",
            )

        if payload.required_quantity < existing["produced_quantity"]:
            raise HTTPException(
                status_code=400,
                detail="Required quantity cannot be less than quantity already produced",
            )

        db.execute(
            text("""
                UPDATE production_requirements
                SET required_quantity = :required_quantity
                WHERE id = :requirement_id
                  AND company_id = :company_id
            """),
            {
                "required_quantity": payload.required_quantity,
                "requirement_id": requirement_id,
                "company_id": company_id,
            },
        )

        db.commit()

        return {
            "message": "Production requirement updated successfully",
            "requirement_id": str(existing["id"]),
            "required_quantity": payload.required_quantity,
        }

    except HTTPException:
        raise
    except Exception:
        db.rollback()
        logger.exception("Failed to update production requirement")
        raise HTTPException(
            status_code=500,
            detail="Failed to update production requirement",
        )


@router.get("/requirements/completed")
def get_completed_production_requirements(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List completed production requirements for the active company."""

    query = text("""
        SELECT
            pr.id,
            pr.sales_order_id,
            pr.sales_order_item_id,
            pr.product_id,
            pr.required_quantity,
            pr.produced_quantity,
            pr.status,
            so.order_number,
            p.sku,
            p.name AS product_name
        FROM production_requirements pr
        JOIN sales_orders so
            ON so.id = pr.sales_order_id
           AND so.company_id = pr.company_id
        JOIN products p
            ON p.id = pr.product_id
        WHERE pr.company_id = :company_id
          AND pr.status = 'COMPLETED'
        ORDER BY so.order_number, pr.created_at DESC
    """)

    try:
        rows = db.execute(
            query,
            {"company_id": current_user["company_id"]},
        ).mappings().all()

        return [dict(row) for row in rows]

    except Exception:
        logger.exception("Error fetching completed production requirements")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch completed production requirements",
        )


@router.delete("/requirements/{requirement_id}")
def delete_production_requirement(
    requirement_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Delete a completed production requirement for the active company."""

    company_id = current_user["company_id"]

    try:
        # Lock the row while validating and deleting it.
        existing = db.execute(
            text("""
                SELECT id, status
                FROM production_requirements
                WHERE id = :requirement_id
                  AND company_id = :company_id
                FOR UPDATE
            """),
            {
                "requirement_id": requirement_id,
                "company_id": company_id,
            },
        ).mappings().first()

        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Production requirement not found",
            )

        if existing["status"] != "COMPLETED":
            raise HTTPException(
                status_code=400,
                detail="Only completed production requirements can be deleted",
            )

        deleted_id = db.execute(
            text("""
                DELETE FROM production_requirements
                WHERE id = :requirement_id
                  AND company_id = :company_id
                  AND status = 'COMPLETED'
                RETURNING id
            """),
            {
                "requirement_id": requirement_id,
                "company_id": company_id,
            },
        ).scalar_one_or_none()

        if deleted_id is None:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="Production requirement changed. Refresh and try again.",
            )

        db.commit()

        return {
            "message": "Production requirement deleted successfully",
            "requirement_id": str(deleted_id),
        }

    except HTTPException:
        db.rollback()
        raise

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                "This requirement has related production records and cannot "
                "be deleted. Preserve the production history."
            ),
        )

    except Exception:
        db.rollback()
        logger.exception("Failed to delete production requirement")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete production requirement",
        )

@router.get("/employees")
def get_production_employees(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List active employees belonging to the active company."""

    query = text("""
        SELECT
            e.id,
            e.employee_code,
            e.full_name,
            e.department_id,
            d.name AS department_name,
            e.designation,
            e.salary_type,
            e.daily_rate,
            e.is_tailor,
            e.is_active
        FROM employees e
        LEFT JOIN departments d
            ON d.id = e.department_id
           AND d.company_id = e.company_id
        WHERE e.company_id = :company_id
          AND e.is_active = TRUE
        ORDER BY e.full_name
    """)

    try:
        rows = db.execute(
            query,
            {"company_id": current_user["company_id"]},
        ).mappings().all()

        return [dict(row) for row in rows]

    except Exception as e:
        print("Error fetching production employees:", e)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch production employees",
        )


@router.get("/operations")
def get_production_operations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List active production operations for the active company."""

    query = text("""
        SELECT
            id,
            operation_code,
            operation_name,
            default_piece_rate,
            is_active
        FROM production_operations
        WHERE company_id = :company_id
          AND is_active = TRUE
        ORDER BY operation_name
    """)

    try:
        rows = db.execute(
            query,
            {"company_id": current_user["company_id"]},
        ).mappings().all()

        return [dict(row) for row in rows]

    except Exception as e:
        print("Error fetching production operations:", e)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch production operations",
        )


@router.get("/assignments")
def get_production_assignments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List task assignments with employee and operation details."""

    query = text("""
        SELECT
            a.id,
            a.production_requirement_id,
            a.employee_id,
            e.employee_code,
            e.full_name AS employee_name,
            a.operation_id,
            o.operation_code,
            o.operation_name,
            a.target_quantity,
            a.due_date,
            a.pay_type,
            a.agreed_rate,
            a.status,
            a.created_at,
            pr.required_quantity,
            pr.produced_quantity
        FROM employee_task_assignments a
        JOIN employees e
            ON e.id = a.employee_id
           AND e.company_id = a.company_id
        JOIN production_operations o
            ON o.id = a.operation_id
           AND o.company_id = a.company_id
        JOIN production_requirements pr
            ON pr.id = a.production_requirement_id
           AND pr.company_id = a.company_id
        WHERE a.company_id = :company_id
        ORDER BY a.created_at DESC
    """)

    try:
        rows = db.execute(
            query,
            {"company_id": current_user["company_id"]},
        ).mappings().all()

        return [dict(row) for row in rows]

    except Exception as e:
        print("Error fetching production assignments:", e)
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch production assignments",
        )

class EmployeeCreate(BaseModel):
    employee_code: str = Field(min_length=1, max_length=50)
    full_name: str = Field(min_length=1, max_length=150)
    department_id: UUID | None = None
    designation: str | None = None
    phone: str | None = None
    email: str | None = None
    joining_date: date | None = None
    salary_type: str = "piece_rate"
    daily_rate: Decimal | None = Field(default=None, ge=0)
    is_tailor: bool = False

class EmployeeUpdate(EmployeeCreate):
    pass


class OperationCreate(BaseModel):
    operation_code: str = Field(min_length=1, max_length=50)
    operation_name: str = Field(min_length=1, max_length=150)
    default_piece_rate: Decimal | None = Field(default=None, ge=0)


class AssignmentCreate(BaseModel):
    production_requirement_id: UUID
    employee_id: UUID
    operation_id: UUID
    target_quantity: Decimal = Field(gt=0)
    due_date: date | None = None
    pay_type: str
    agreed_rate: Decimal = Field(ge=0)


class WorkSubmit(BaseModel):
    work_date: date
    quantity_completed: Decimal = Field(gt=0)
    payable_units: Decimal = Field(default=Decimal("0"), ge=0)
    supervisor_notes: str | None = None


class WorkDecision(BaseModel):
    quantity_accepted: Decimal = Field(ge=0)
    payable_units: Decimal | None = Field(default=None, ge=0)
    supervisor_notes: str | None = None

@router.post("/employees")
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("ADMIN", "PRODUCTION_MANAGER")
    ),
):
    company_id = current_user["company_id"]

    if payload.salary_type not in ("daily", "piece_rate"):
        raise HTTPException(
            status_code=400,
            detail="First release supports daily and piece_rate employees.",
        )

    if payload.salary_type == "daily" and payload.daily_rate is None:
        raise HTTPException(
            status_code=400,
            detail="Daily rate is required for daily-wage employees.",
        )

    if payload.department_id:
        department = db.execute(
            text("""
                SELECT id
                FROM departments
                WHERE id = :department_id
                  AND company_id = :company_id
                  AND is_active = TRUE
            """),
            {
                "department_id": payload.department_id,
                "company_id": company_id,
            },
        ).first()

        if not department:
            raise HTTPException(
                status_code=400,
                detail="Invalid or inactive department.",
            )

    try:
        row = db.execute(
            text("""
                INSERT INTO employees (
                    company_id,
                    employee_code,
                    full_name,
                    department_id,
                    designation,
                    phone,
                    email,
                    joining_date,
                    salary_type,
                    daily_rate,
                    is_tailor
                )
                VALUES (
                    :company_id,
                    :employee_code,
                    :full_name,
                    :department_id,
                    :designation,
                    :phone,
                    :email,
                    :joining_date,
                    :salary_type,
                    :daily_rate,
                    :is_tailor
                )
                RETURNING id, employee_code, full_name, salary_type
            """),
            {
                "company_id": company_id,
                **payload.model_dump(),
            },
        ).mappings().one()

        db.commit()
        return dict(row)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print("Error creating employee:", e)
        raise HTTPException(
            status_code=400,
            detail="Failed to create employee. Check the employee code and supplied values.",
        )

@router.put("/employees/{employee_id}")
def update_employee(
    employee_id: UUID,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("ADMIN", "PRODUCTION_MANAGER")
    ),
):
    company_id = current_user["company_id"]

    if payload.salary_type not in ("daily", "piece_rate"):
        raise HTTPException(
            status_code=400,
            detail="First release supports daily and piece_rate employees.",
        )

    if payload.salary_type == "daily" and payload.daily_rate is None:
        raise HTTPException(
            status_code=400,
            detail="Daily rate is required for daily-wage employees.",
        )

    try:
        existing = db.execute(
            text("""
                SELECT id
                FROM employees
                WHERE id = :employee_id
                  AND company_id = :company_id
                  AND is_active = TRUE
            """),
            {
                "employee_id": employee_id,
                "company_id": company_id,
            },
        ).first()

        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Active employee not found.",
            )

        # Validate the department only if the request supplies it.
        if payload.department_id is not None:
            department = db.execute(
                text("""
                    SELECT id
                    FROM departments
                    WHERE id = :department_id
                      AND company_id = :company_id
                      AND is_active = TRUE
                """),
                {
                    "department_id": payload.department_id,
                    "company_id": company_id,
                },
            ).first()

            if not department:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid or inactive department.",
                )

        department_was_sent = (
            "department_id" in payload.model_fields_set
        )

        row = db.execute(
            text("""
                UPDATE employees
                SET
                    employee_code = :employee_code,
                    full_name = :full_name,
                    department_id = CASE
                        WHEN :update_department
                        THEN :department_id
                        ELSE department_id
                    END,
                    designation = :designation,
                    phone = :phone,
                    email = :email,
                    joining_date = :joining_date,
                    salary_type = :salary_type,
                    daily_rate = :daily_rate,
                    is_tailor = :is_tailor,
                    updated_at = NOW()
                WHERE id = :employee_id
                  AND company_id = :company_id
                  AND is_active = TRUE
                RETURNING
                    id,
                    employee_code,
                    full_name,
                    department_id,
                    designation,
                    phone,
                    email,
                    joining_date,
                    salary_type,
                    daily_rate,
                    is_tailor
            """),
            {
                "employee_id": employee_id,
                "company_id": company_id,
                "update_department": department_was_sent,
                **payload.model_dump(),
            },
        ).mappings().one()

        db.commit()
        return dict(row)

    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as e:
        db.rollback()
        logger.warning("Employee update constraint violation: %s", e)
        raise HTTPException(
            status_code=409,
            detail="An employee with this code already exists in this company.",
        )
    except Exception as e:
        db.rollback()
        logger.exception("Error updating production employee: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Failed to update production employee.",
        )

@router.post("/operations")
def create_operation(
    payload: OperationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("ADMIN", "PRODUCTION_MANAGER")
    ),
):
    try:
        row = db.execute(
            text("""
                INSERT INTO production_operations (
                    company_id,
                    operation_code,
                    operation_name,
                    default_piece_rate
                )
                VALUES (
                    :company_id,
                    :operation_code,
                    :operation_name,
                    :default_piece_rate
                )
                RETURNING
                    id, operation_code, operation_name,
                    default_piece_rate, is_active
            """),
            {
                "company_id": current_user["company_id"],
                **payload.model_dump(),
            },
        ).mappings().one()

        db.commit()
        return dict(row)

    except Exception as e:
        db.rollback()
        print("Error creating production operation:", e)
        raise HTTPException(
            status_code=400,
            detail="Failed to create operation. Check whether its code already exists.",
        )

@router.post("/assignments")
def create_assignment(
    payload: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("ADMIN", "PRODUCTION_MANAGER")
    ),
):
    if payload.pay_type not in ("piece_rate", "daily"):
        raise HTTPException(
            status_code=400,
            detail="pay_type must be piece_rate or daily.",
        )

    company_id = current_user["company_id"]
    if payload.target_quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="target_quantity must be greater than zero.",
    )

    if payload.agreed_rate < 0:
        raise HTTPException(
            status_code=400,
            detail="agreed_rate cannot be negative.",
    )
    try:
        requirement = db.execute(
            text("""
                SELECT id, required_quantity, status
                FROM production_requirements
                WHERE id = :requirement_id
                  AND company_id = :company_id
                FOR UPDATE
            """),
            {
                "requirement_id": payload.production_requirement_id,
                "company_id": company_id,
            },
        ).mappings().first()

        if not requirement or requirement["status"] in (
            "COMPLETED", "CANCELLED"
        ):
            raise HTTPException(
                status_code=400,
                detail="Production requirement not found or is closed.",
            )

        employee = db.execute(
            text("""
                SELECT id, salary_type, daily_rate
                FROM employees
                WHERE id = :employee_id
                  AND company_id = :company_id
                  AND is_active = TRUE
            """),
            {
                "employee_id": payload.employee_id,
                "company_id": company_id,
            },
        ).mappings().first()

        if not employee:
            raise HTTPException(
                status_code=400,
                detail="Employee not found or inactive.",
            )

        operation = db.execute(
            text("""
                SELECT id
                FROM production_operations
                WHERE id = :operation_id
                  AND company_id = :company_id
                  AND is_active = TRUE
            """),
            {
                "operation_id": payload.operation_id,
                "company_id": company_id,
            },
        ).first()

        if not operation:
            raise HTTPException(
                status_code=400,
                detail="Operation not found or inactive.",
            )

        if (
            payload.pay_type == "daily"
            and employee["daily_rate"] is None
        ):
            raise HTTPException(
                status_code=400,
                detail="This employee has no daily rate configured.",
            )

        row = db.execute(
            text("""
                INSERT INTO employee_task_assignments (
                    company_id,
                    production_requirement_id,
                    employee_id,
                    operation_id,
                    target_quantity,
                    due_date,
                    pay_type,
                    agreed_rate,
                    assigned_by
                )
                VALUES (
                    :company_id,
                    :requirement_id,
                    :employee_id,
                    :operation_id,
                    :target_quantity,
                    :due_date,
                    :pay_type,
                    :agreed_rate,
                    :assigned_by
                )
                RETURNING *
            """),
            {
                "company_id": company_id,
                "requirement_id": payload.production_requirement_id,
                "employee_id": payload.employee_id,
                "operation_id": payload.operation_id,
                "target_quantity": payload.target_quantity,
                "due_date": payload.due_date,
                "pay_type": payload.pay_type,
                "agreed_rate": payload.agreed_rate,
                "assigned_by": current_user["id"],
            },
        ).mappings().one()

        db.commit()
        return dict(row)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print("Error creating assignment:", e)
        raise HTTPException(
            status_code=400,
            detail="Failed to create assignment. Check the supplied values.",
        )

@router.patch("/assignments/{assignment_id}")
def update_assignment(
    assignment_id: str,
    payload: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("ADMIN", "PRODUCTION_MANAGER")
    ),
):
    if payload.pay_type not in ("piece_rate", "daily"):
        raise HTTPException(
            status_code=400,
            detail="pay_type must be piece_rate or daily.",
        )

    company_id = current_user["company_id"]

    try:
        assignment = db.execute(
            text("""
                SELECT
                    a.id,
                    a.employee_id,
                    a.status,
                    e.daily_rate
                FROM employee_task_assignments a
                JOIN employees e
                    ON e.id = a.employee_id
                   AND e.company_id = a.company_id
                WHERE a.id = :assignment_id
                  AND a.company_id = :company_id
                FOR UPDATE OF a
            """),
            {
                "assignment_id": assignment_id,
                "company_id": company_id,
            },
        ).mappings().first()

        if not assignment:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found.",
            )

        if assignment["status"].upper() != "ASSIGNED":
            raise HTTPException(
                status_code=400,
                detail="Only assignments with ASSIGNED status can be edited.",
            )

        if (
            payload.pay_type == "daily"
            and assignment["daily_rate"] is None
        ):
            raise HTTPException(
                status_code=400,
                detail="This employee has no daily rate configured.",
            )

        updated = db.execute(
            text("""
                UPDATE employee_task_assignments
                SET
                    target_quantity = :target_quantity,
                    due_date = :due_date,
                    pay_type = :pay_type,
                    agreed_rate = :agreed_rate
                WHERE id = :assignment_id
                  AND company_id = :company_id
                  AND status = 'ASSIGNED'
                RETURNING *
            """),
            {
                "assignment_id": assignment_id,
                "company_id": company_id,
                "target_quantity": payload.target_quantity,
                "due_date": payload.due_date,
                "pay_type": payload.pay_type,
                "agreed_rate": payload.agreed_rate,
            },
        ).mappings().one_or_none()

        if not updated:
            raise HTTPException(
                status_code=409,
                detail="Assignment could not be updated.",
            )

        db.commit()
        return dict(updated)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print("Error updating production assignment:", e)
        raise HTTPException(
            status_code=400,
            detail="Failed to update assignment.",
        )



@router.delete("/assignments/{assignment_id}")
def delete_production_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("ADMIN", "PRODUCTION_MANAGER")
    ),
):
    """Delete an unused assignment without affecting production history."""

    company_id = current_user["company_id"]

    try:
        # Lock the assignment to prevent concurrent updates while deleting.
        assignment = db.execute(
            text("""
                SELECT id, status
                FROM employee_task_assignments
                WHERE id = :assignment_id
                  AND company_id = :company_id
                FOR UPDATE
            """),
            {
                "assignment_id": assignment_id,
                "company_id": company_id,
            },
        ).mappings().first()

        if not assignment:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found.",
            )

        # Only an unused assignment can be deleted.
        if assignment["status"].upper() != "ASSIGNED":
            raise HTTPException(
                status_code=409,
                detail=(
                    "Only unused assignments with ASSIGNED status "
                    "can be deleted."
                ),
            )

        # Preserve every submitted work record and its payment history.
        has_work = db.execute(
            text("""
                SELECT EXISTS (
                    SELECT 1
                    FROM employee_piece_work
                    WHERE assignment_id = :assignment_id
                      AND company_id = :company_id
                )
            """),
            {
                "assignment_id": assignment_id,
                "company_id": company_id,
            },
        ).scalar()

        if has_work:
            raise HTTPException(
                status_code=409,
                detail=(
                    "This assignment has employee work records and "
                    "cannot be deleted. Preserve the production history."
                ),
            )

        deleted_id = db.execute(
            text("""
                DELETE FROM employee_task_assignments
                WHERE id = :assignment_id
                  AND company_id = :company_id
                  AND status = 'ASSIGNED'
                RETURNING id
            """),
            {
                "assignment_id": assignment_id,
                "company_id": company_id,
            },
        ).scalar_one_or_none()

        if deleted_id is None:
            raise HTTPException(
                status_code=409,
                detail="Assignment changed. Refresh and try again.",
            )

        db.commit()

        return {
            "message": "Assignment deleted successfully.",
            "assignment_id": str(deleted_id),
        }

    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        logger.exception("Assignment deletion blocked by related records")
        raise HTTPException(
            status_code=409,
            detail="Related records prevent this assignment from being deleted.",
        )
    except Exception:
        db.rollback()
        logger.exception("Failed to delete production assignment")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete production assignment.",
        )

@router.post("/assignments/{assignment_id}/work")
def submit_assignment_work(
    assignment_id: UUID,
    payload: WorkSubmit,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("ADMIN", "PRODUCTION_MANAGER")
    ),
):
    company_id = current_user["company_id"]

    try:
        assignment = db.execute(
            text("""
                SELECT
                    id, employee_id, operation_id,
                    pay_type, agreed_rate, target_quantity, status
                FROM employee_task_assignments
                WHERE id = :assignment_id
                  AND company_id = :company_id
                FOR UPDATE
            """),
            {
                "assignment_id": assignment_id,
                "company_id": company_id,
            },
        ).mappings().first()

        if not assignment:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found.",
            )

        if assignment["status"] in ("COMPLETED", "CANCELLED"):
            raise HTTPException(
                status_code=400,
                detail="This assignment is already closed.",
            )

        if assignment["pay_type"] == "daily" and payload.payable_units <= 0:
            raise HTTPException(
                status_code=400,
                detail="Enter payable days for daily-wage work.",
            )

        row = db.execute(
            text("""
            INSERT INTO employee_piece_work (
                company_id,
                employee_id,
                operation_id,
                work_date,
                quantity_completed,
                quantity_accepted,
                rate_per_piece,
                assignment_id,
                pay_type,
                payable_units,
                verification_status,
                recorded_by,
                supervisor_notes
            )
            VALUES (
                 :company_id,
                 :employee_id,
                 :operation_id,
                 :work_date,
                 :quantity_completed,
                 0,
                 :rate,
                 :assignment_id,
                 :pay_type,
                 :payable_units,
                 'PENDING',
                 :recorded_by,
                 :notes
            )
            RETURNING *
            """),
            {
                "company_id": company_id,
                "employee_id": assignment["employee_id"],
                "operation_id": assignment["operation_id"],
                "work_date": payload.work_date,
                "quantity_completed": payload.quantity_completed,
                "rate": assignment["agreed_rate"],
                "assignment_id": assignment_id,
                "pay_type": assignment["pay_type"],
                "payable_units": payload.payable_units,
                "recorded_by": current_user["id"],
                "notes": payload.supervisor_notes,
            },
        ).mappings().one()

        db.execute(
            text("""
                UPDATE employee_task_assignments
                SET status = 'IN_PROGRESS',
                    updated_at = NOW()
                WHERE id = :assignment_id
                  AND company_id = :company_id
                  AND status = 'ASSIGNED'
            """),
            {
                "assignment_id": assignment_id,
                "company_id": company_id,
            },
        )

        db.commit()
        return dict(row)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.exception("Failed to submit employee work")
        print("Error submitting employee work:", e)
        raise HTTPException(
            status_code=400,
            detail="Failed to submit employee work.",
        )


@router.get("/work/pending")
def get_pending_employee_work(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("ADMIN", "PRODUCTION_MANAGER")
    ),
):
    try:
        rows = db.execute(
            text("""
                SELECT
                    w.id,
                    w.assignment_id,
                    w.employee_id,
                    e.full_name AS employee_name,
                    w.operation_id,
                    o.operation_name,
                    w.work_date,
                    w.quantity_completed,
                    w.quantity_accepted,
                    w.rate_per_piece,
                    w.amount,
                    w.pay_type,
                    w.payable_units,
                    w.supervisor_notes,
                    w.recorded_by,
                    w.created_at
                FROM employee_piece_work w
                JOIN employees e
                  ON e.id = w.employee_id
                 AND e.company_id = w.company_id
                JOIN production_operations o
                  ON o.id = w.operation_id
                 AND o.company_id = w.company_id
                WHERE w.company_id = :company_id
                  AND w.verification_status = 'PENDING'
                ORDER BY w.work_date ASC, w.created_at ASC
            """),
            {"company_id": current_user["company_id"]},
        ).mappings().all()

        return [dict(row) for row in rows]

    except Exception:
        logger.exception("Failed to load pending employee work")
        raise HTTPException(
            status_code=500,
            detail="Failed to load pending employee work.",
        )


@router.post("/work/{work_id}/verify")
def verify_employee_work(
    work_id: UUID,
    payload: WorkDecision,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("ADMIN", "PRODUCTION_MANAGER")
    ),
):
    company_id = current_user["company_id"]

    try:
        # Lock the pending work record so concurrent reviews
        # cannot approve the same submission twice.
        work = db.execute(
            text("""
                SELECT
                    id,
                    quantity_completed,
                    pay_type,
                    verification_status
                FROM employee_piece_work
                WHERE id = :work_id
                  AND company_id = :company_id
                FOR UPDATE
            """),
            {
                "work_id": work_id,
                "company_id": company_id,
            },
        ).mappings().first()

        if not work or work["verification_status"] != "PENDING":
            raise HTTPException(
                status_code=404,
                detail="Pending work record not found.",
            )

        if payload.quantity_accepted > work["quantity_completed"]:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Accepted quantity cannot exceed "
                    "the submitted quantity."
                ),
            )

        if work["pay_type"] == "piece_rate":
            payable_units = payload.quantity_accepted
        else:
            if payload.payable_units is None or payload.payable_units <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Enter payable days or units "
                        "for daily-wage work."
                    ),
                )
            payable_units = payload.payable_units

        result = db.execute(
            text("""
                UPDATE employee_piece_work
                SET quantity_accepted = :quantity_accepted,
                    payable_units = :payable_units,
                    verification_status = 'APPROVED',
                    verified_by = :verified_by,
                    verified_at = NOW(),
                    supervisor_notes = :notes
                WHERE id = :work_id
                  AND company_id = :company_id
                  AND verification_status = 'PENDING'
                RETURNING
                    id,
                    quantity_completed,
                    quantity_accepted,
                    payable_units,
                    amount,
                    verification_status,
                    verified_by,
                    verified_at,
                    supervisor_notes
            """),
            {
                "work_id": work_id,
                "company_id": company_id,
                "quantity_accepted": payload.quantity_accepted,
                "payable_units": payable_units,
                "verified_by": current_user["id"],
                "notes": payload.supervisor_notes,
            },
        ).mappings().first()

        if not result:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="This work record has already been reviewed.",
            )

        db.commit()
        return dict(result)

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        logger.exception("Failed to verify employee work")
        raise HTTPException(
            status_code=500,
            detail="Failed to verify employee work.",
        )

@router.post("/work/{work_id}/reject")
def reject_employee_work(
    work_id: UUID,
    payload: WorkDecision,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("ADMIN", "PRODUCTION_MANAGER")
    ),
):
    try:
        result = db.execute(
            text("""
                UPDATE employee_piece_work
                SET verification_status = 'REJECTED',
                    verified_by = :verified_by,
                    verified_at = NOW(),
                    supervisor_notes = :notes
                WHERE id = :work_id
                  AND company_id = :company_id
                  AND verification_status = 'PENDING'
                RETURNING id, verification_status, supervisor_notes
            """),
            {
                "work_id": work_id,
                "company_id": current_user["company_id"],
                "verified_by": current_user["id"],
                "notes": payload.supervisor_notes,
            },
        ).mappings().first()

        if not result:
            db.rollback()
            raise HTTPException(
                status_code=404,
                detail="Pending work record not found.",
            )

        db.commit()
        return dict(result)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print("Error rejecting employee work:", e)
        raise HTTPException(
            status_code=400,
            detail="Failed to reject employee work.",
        )

