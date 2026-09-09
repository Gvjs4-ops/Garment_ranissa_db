from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import require_admin, supabase_admin


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


ALLOWED_ROLES = {
    "ADMIN",
    "SALES_MANAGER",
    "SALES_EXECUTIVE",
    "INVENTORY_MANAGER",
    "PRODUCTION_MANAGER",
    "ACCOUNTANT",
    "USER",
}


class CreateUserPayload(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str
    company_id: str


class UpdateUserPayload(BaseModel):
    full_name: str
    email: EmailStr
    role: str
    is_active: bool


@router.get("")
def get_users(
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    query = text("""
        SELECT
            cu.id,
            cu.user_id,
            au.email,
            au.raw_user_meta_data,
            cu.company_id,
            c.display_name AS company_name,
            cu.role,
            cu.is_active,
            cu.joined_at
        FROM company_users cu
        LEFT JOIN auth.users au
            ON au.id = cu.user_id
        LEFT JOIN companies c
            ON c.id = cu.company_id
        ORDER BY cu.joined_at DESC
    """)

    rows = db.execute(query).mappings().all()

    users = []

    for row in rows:
        user = dict(row)

        metadata = (
            user.pop(
                "raw_user_meta_data",
                None,
            )
            or {}
        )

        user["full_name"] = (
            metadata.get("full_name", "")
        )

        users.append(user)

    return users


@router.post("")
def create_user(
    payload: CreateUserPayload,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    if payload.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid role",
        )

    full_name = payload.full_name.strip()

    if not full_name:
        raise HTTPException(
            status_code=400,
            detail="Full name is required",
        )

    if len(payload.password) < 6:
        raise HTTPException(
            status_code=400,
            detail=(
                "Password must be at least "
                "6 characters"
            ),
        )

    auth_user = None

    try:
        auth_response = (
            supabase_admin.auth.admin.create_user(
                {
                    "email": str(payload.email),
                    "password": payload.password,
                    "email_confirm": True,
                    "user_metadata": {
                        "full_name": full_name,
                    },
                }
            )
        )

        auth_user = auth_response.user

        if not auth_user:
            raise HTTPException(
                status_code=500,
                detail="Failed to create auth user",
            )

        query = text("""
            INSERT INTO company_users (
                company_id,
                user_id,
                role,
                is_active
            )
            VALUES (
                :company_id,
                :user_id,
                :role,
                true
            )
            RETURNING
                id,
                company_id,
                user_id,
                role,
                is_active,
                joined_at
        """)

        result = db.execute(
            query,
            {
                "company_id": payload.company_id,
                "user_id": str(auth_user.id),
                "role": payload.role,
            },
        ).mappings().first()

        db.commit()

        company_query = text("""
            SELECT display_name
            FROM companies
            WHERE id = :company_id
        """)

        company_name = db.execute(
            company_query,
            {
                "company_id": payload.company_id,
            },
        ).scalar()

        return {
            **dict(result),
            "email": str(payload.email),
            "full_name": full_name,
            "company_name": company_name,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        # Remove orphan Auth user if company
        # membership creation failed.
        if auth_user:
            try:
                supabase_admin.auth.admin.delete_user(
                    str(auth_user.id)
                )
            except Exception as cleanup_error:
                print(
                    "Failed to clean up auth user:",
                    cleanup_error,
                )

        print(
            "Create user error:",
            error,
        )

        error_message = str(error)

        if (
            "already" in error_message.lower()
            and "registered" in error_message.lower()
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "A user with this email "
                    "already exists"
                ),
            )

        raise HTTPException(
            status_code=500,
            detail=error_message,
        )


@router.put("/{company_user_id}")
def update_user(
    company_user_id: str,
    payload: UpdateUserPayload,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    if payload.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid role",
        )

    full_name = payload.full_name.strip()

    if not full_name:
        raise HTTPException(
            status_code=400,
            detail="Full name is required",
        )

    # Find the company membership.
    membership_query = text("""
        SELECT
            cu.id,
            cu.user_id,
            cu.company_id
        FROM company_users cu
        WHERE cu.id = :company_user_id
        LIMIT 1
    """)

    membership = db.execute(
        membership_query,
        {
            "company_user_id": company_user_id,
        },
    ).mappings().first()

    if not membership:
        raise HTTPException(
            status_code=404,
            detail="User access record not found",
        )

    # Check whether the administrator is
    # editing their own account.
    is_current_user = (
        str(membership["user_id"])
        == str(admin["user_id"])
    )

    # Protect administrator from accidentally
    # removing their own administrator access.
    if is_current_user:
        if payload.role != "ADMIN":
            raise HTTPException(
                status_code=400,
                detail=(
                    "You cannot remove your own "
                    "Administrator role."
                ),
            )

        if not payload.is_active:
            raise HTTPException(
                status_code=400,
                detail=(
                    "You cannot deactivate your "
                    "own account."
                ),
            )

    user_id = str(
        membership["user_id"]
    )

    try:
        # Update email and full name in
        # Supabase Auth.
        supabase_admin.auth.admin.update_user_by_id(
            user_id,
            {
                "email": str(payload.email),
                "email_confirm": True,
                "user_metadata": {
                    "full_name": full_name,
                },
            },
        )

        # Update ERP role and status.
        update_query = text("""
            UPDATE company_users
            SET
                role = :role,
                is_active = :is_active
            WHERE id = :company_user_id
            RETURNING
                id,
                user_id,
                company_id,
                role,
                is_active,
                joined_at
        """)

        result = db.execute(
            update_query,
            {
                "company_user_id": company_user_id,
                "role": payload.role,
                "is_active": payload.is_active,
            },
        ).mappings().first()

        if not result:
            raise HTTPException(
                status_code=404,
                detail="User access record not found",
            )

        db.commit()

        company_query = text("""
            SELECT display_name
            FROM companies
            WHERE id = :company_id
        """)

        company_name = db.execute(
            company_query,
            {
                "company_id": result["company_id"],
            },
        ).scalar()

        return {
            **dict(result),
            "email": str(payload.email),
            "full_name": full_name,
            "company_name": company_name,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        print(
            "Update user error:",
            error,
        )

        error_message = str(error)

        if (
            "already" in error_message.lower()
            or "duplicate" in error_message.lower()
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "That email address is already "
                    "being used by another user"
                ),
            )

        raise HTTPException(
            status_code=500,
            detail=error_message,
        )


@router.delete("/{company_user_id}")
def remove_user_access(
    company_user_id: str,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    # Find membership before deactivating it.
    membership_query = text("""
        SELECT
            id,
            user_id,
            role,
            is_active
        FROM company_users
        WHERE id = :company_user_id
        LIMIT 1
    """)

    membership = db.execute(
        membership_query,
        {
            "company_user_id": company_user_id,
        },
    ).mappings().first()

    if not membership:
        raise HTTPException(
            status_code=404,
            detail="User access record not found",
        )

    # Prevent administrator from removing
    # their own access.
    if (
        str(membership["user_id"])
        == str(admin["user_id"])
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "You cannot remove access "
                "from your own account."
            ),
        )

    # Soft deactivate company access.
    query = text("""
        UPDATE company_users
        SET is_active = false
        WHERE id = :company_user_id
        RETURNING
            id,
            user_id,
            company_id,
            role,
            is_active
    """)

    result = db.execute(
        query,
        {
            "company_user_id": company_user_id,
        },
    ).mappings().first()

    if not result:
        raise HTTPException(
            status_code=404,
            detail="User access record not found",
        )

    db.commit()

    return {
        "message": "User access removed",
        "user": dict(result),
    }
