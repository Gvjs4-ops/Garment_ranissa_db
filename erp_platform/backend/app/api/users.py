from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user, require_roles


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


USER_ROLES = {
    "ADMIN",
    "SALES_MANAGER",
    "SALES_EXECUTIVE",
    "INVENTORY_MANAGER",
    "PRODUCTION_MANAGER",
    "ACCOUNTANT",
    "USER",
}


class CreateUserRequest(BaseModel):
    full_name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=6)
    role: str
    company_id: UUID


class UpdateUserRequest(BaseModel):
    full_name: str = Field(min_length=1)
    email: EmailStr
    role: str
    is_active: bool


def validate_role(role: str):
    if role not in USER_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid user role: {role}",
        )


def supabase_headers():
    return {
        "apikey": settings.SUPABASE_SECRET_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SECRET_KEY}",
        "Content-Type": "application/json",
    }


# -------------------------------------------------------------------
# Current logged-in user
# -------------------------------------------------------------------

@router.get("/me")
def get_my_user(
    current_user=Depends(get_current_user),
):
    """
    Return the currently authenticated ERP user.
    Any authenticated company member can access this endpoint.
    """
    return current_user


# -------------------------------------------------------------------
# List users
# ADMIN only
# -------------------------------------------------------------------

@router.get("")
def get_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    """
    Return users belonging to the current user's company.

    ADMIN only.
    """

    try:
        query = text("""
            SELECT
                cu.id,
                cu.user_id,
                p.full_name,
                au.email,
                cu.company_id,
                c.display_name AS company_name,
                cu.role,
                cu.is_active,
                cu.joined_at
            FROM company_users cu
            JOIN profiles p
                ON p.id = cu.user_id
            JOIN companies c
                ON c.id = cu.company_id
            LEFT JOIN auth.users au
                ON au.id = cu.user_id
            WHERE cu.company_id = :company_id
            ORDER BY cu.joined_at DESC
        """)

        rows = db.execute(
            query,
            {
                "company_id": current_user["company_id"],
            },
        ).mappings().all()

        return [dict(row) for row in rows]

    except Exception as e:
        print("Error fetching users:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to fetch users",
        )


# -------------------------------------------------------------------
# Create user
# ADMIN only
# -------------------------------------------------------------------

@router.post("")
def create_user(
    payload: CreateUserRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    """
    Create a Supabase Auth user and attach the user to
    the ADMIN's company.

    ADMIN only.
    """

    validate_role(payload.role)

    # ---------------------------------------------------------------
    # SECURITY:
    # An ADMIN cannot create a user in another company.
    # ---------------------------------------------------------------

    if str(payload.company_id) != str(current_user["company_id"]):
        raise HTTPException(
            status_code=403,
            detail="You cannot create users for another company",
        )

    # Verify company exists and is active.
    company = db.execute(
        text("""
            SELECT id
            FROM companies
            WHERE id = :company_id
              AND is_active = TRUE
        """),
        {
            "company_id": payload.company_id,
        },
    ).first()

    if not company:
        raise HTTPException(
            status_code=400,
            detail="Invalid or inactive company",
        )

    # Prevent duplicate ERP membership.
    existing_email = db.execute(
        text("""
            SELECT au.id
            FROM auth.users au
            JOIN company_users cu
                ON cu.user_id = au.id
            WHERE lower(au.email) = lower(:email)
              AND cu.company_id = :company_id
            LIMIT 1
        """),
        {
            "email": payload.email,
            "company_id": payload.company_id,
        },
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=409,
            detail="User already exists in this company",
        )

    auth_user_id = None

    try:
        # -----------------------------------------------------------
        # Create Supabase Auth user.
        # This uses the backend-only secret key.
        # -----------------------------------------------------------

        response = httpx.post(
            f"{settings.SUPABASE_URL}/auth/v1/admin/users",
            headers=supabase_headers(),
            json={
                "email": payload.email,
                "password": payload.password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": payload.full_name,
                },
            },
            timeout=15,
        )

        if response.status_code >= 400:
            try:
                error_data = response.json()

                detail = (
                    error_data.get("msg")
                    or error_data.get("message")
                    or error_data.get("error_description")
                    or "Failed to create authentication user"
                )

            except Exception:
                detail = "Failed to create authentication user"

            raise HTTPException(
                status_code=400,
                detail=detail,
            )

        auth_user = response.json()
        auth_user_id = auth_user.get("id")

        if not auth_user_id:
            raise HTTPException(
                status_code=500,
                detail="Supabase did not return a user ID",
            )

        # -----------------------------------------------------------
        # Create ERP profile.
        # -----------------------------------------------------------

        db.execute(
            text("""
                INSERT INTO profiles (
                    id,
                    full_name,
                    is_active
                )
                VALUES (
                    :user_id,
                    :full_name,
                    TRUE
                )
            """),
            {
                "user_id": auth_user_id,
                "full_name": payload.full_name,
            },
        )

        # -----------------------------------------------------------
        # Create company membership.
        # -----------------------------------------------------------

        db.execute(
            text("""
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
                    TRUE
                )
            """),
            {
                "company_id": payload.company_id,
                "user_id": auth_user_id,
                "role": payload.role,
            },
        )

        db.commit()

        # -----------------------------------------------------------
        # Return created ERP user.
        # -----------------------------------------------------------

        row = db.execute(
            text("""
                SELECT
                    cu.id,
                    cu.user_id,
                    p.full_name,
                    au.email,
                    cu.company_id,
                    c.display_name AS company_name,
                    cu.role,
                    cu.is_active,
                    cu.joined_at
                FROM company_users cu
                JOIN profiles p
                    ON p.id = cu.user_id
                JOIN companies c
                    ON c.id = cu.company_id
                LEFT JOIN auth.users au
                    ON au.id = cu.user_id
                WHERE cu.user_id = :user_id
                  AND cu.company_id = :company_id
                LIMIT 1
            """),
            {
                "user_id": auth_user_id,
                "company_id": payload.company_id,
            },
        ).mappings().one()

        return dict(row)

    except HTTPException:
        db.rollback()

        if auth_user_id:
            try:
                httpx.delete(
                    f"{settings.SUPABASE_URL}/auth/v1/admin/users/{auth_user_id}",
                    headers=supabase_headers(),
                    timeout=15,
                )
            except Exception as cleanup_error:
                print(
                    "Failed to cleanup Supabase Auth user:",
                    cleanup_error,
                )

        raise

    except Exception as e:
        db.rollback()

        print("Error creating user:", e)

        # If DB creation failed after Auth creation,
        # remove the Auth user so we don't leave an orphan.
        if auth_user_id:
            try:
                httpx.delete(
                    f"{settings.SUPABASE_URL}/auth/v1/admin/users/{auth_user_id}",
                    headers=supabase_headers(),
                    timeout=15,
                )
            except Exception as cleanup_error:
                print(
                    "Failed to cleanup Supabase Auth user:",
                    cleanup_error,
                )

        raise HTTPException(
            status_code=500,
            detail="Failed to create user",
        )


# -------------------------------------------------------------------
# Update user
# ADMIN only
# -------------------------------------------------------------------

@router.put("/{company_user_id}")
def update_user(
    company_user_id: UUID,
    payload: UpdateUserRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    """
    Update an existing company user.

    ADMIN only.
    """

    validate_role(payload.role)

    # ---------------------------------------------------------------
    # Find membership and enforce company isolation.
    # ---------------------------------------------------------------

    membership = db.execute(
        text("""
            SELECT
                cu.id,
                cu.user_id,
                cu.company_id
            FROM company_users cu
            WHERE cu.id = :company_user_id
              AND cu.company_id = :company_id
            LIMIT 1
        """),
        {
            "company_user_id": company_user_id,
            "company_id": current_user["company_id"],
        },
    ).mappings().first()

    if not membership:
        raise HTTPException(
            status_code=404,
            detail="User not found in your company",
        )

    user_id = membership["user_id"]

    try:
        # -----------------------------------------------------------
        # Update ERP profile.
        # -----------------------------------------------------------

        db.execute(
            text("""
                UPDATE profiles
                SET
                    full_name = :full_name,
                    is_active = :is_active
                WHERE id = :user_id
            """),
            {
                "full_name": payload.full_name,
                "is_active": payload.is_active,
                "user_id": user_id,
            },
        )

        # -----------------------------------------------------------
        # Update company membership.
        # -----------------------------------------------------------

        db.execute(
            text("""
                UPDATE company_users
                SET
                    role = :role,
                    is_active = :is_active
                WHERE id = :company_user_id
                  AND company_id = :company_id
            """),
            {
                "role": payload.role,
                "is_active": payload.is_active,
                "company_user_id": company_user_id,
                "company_id": current_user["company_id"],
            },
        )

        # -----------------------------------------------------------
        # Update Supabase Auth email.
        # -----------------------------------------------------------

        response = httpx.put(
            f"{settings.SUPABASE_URL}/auth/v1/admin/users/{user_id}",
            headers=supabase_headers(),
            json={
                "email": payload.email,
            },
            timeout=15,
        )

        if response.status_code >= 400:
            try:
                error_data = response.json()

                detail = (
                    error_data.get("msg")
                    or error_data.get("message")
                    or error_data.get("error_description")
                    or "Failed to update authentication user"
                )

            except Exception:
                detail = "Failed to update authentication user"

            db.rollback()

            raise HTTPException(
                status_code=400,
                detail=detail,
            )

        db.commit()

        # -----------------------------------------------------------
        # Return updated user.
        # -----------------------------------------------------------

        row = db.execute(
            text("""
                SELECT
                    cu.id,
                    cu.user_id,
                    p.full_name,
                    au.email,
                    cu.company_id,
                    c.display_name AS company_name,
                    cu.role,
                    cu.is_active,
                    cu.joined_at
                FROM company_users cu
                JOIN profiles p
                    ON p.id = cu.user_id
                JOIN companies c
                    ON c.id = cu.company_id
                LEFT JOIN auth.users au
                    ON au.id = cu.user_id
                WHERE cu.id = :company_user_id
                  AND cu.company_id = :company_id
                LIMIT 1
            """),
            {
                "company_user_id": company_user_id,
                "company_id": current_user["company_id"],
            },
        ).mappings().one()

        return dict(row)

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        print("Error updating user:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to update user",
        )


# -------------------------------------------------------------------
# Delete / deactivate user
# ADMIN only
# -------------------------------------------------------------------

@router.delete("/{company_user_id}")
def delete_user(
    company_user_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    """
    Deactivate an ERP user and their company membership.

    The Supabase Auth account is intentionally NOT deleted here.
    This preserves historical ERP records.
    """

    membership = db.execute(
        text("""
            SELECT
                cu.id,
                cu.user_id,
                cu.company_id,
                cu.role
            FROM company_users cu
            WHERE cu.id = :company_user_id
              AND cu.company_id = :company_id
            LIMIT 1
        """),
        {
            "company_user_id": company_user_id,
            "company_id": current_user["company_id"],
        },
    ).mappings().first()

    if not membership:
        raise HTTPException(
            status_code=404,
            detail="User not found in your company",
        )

    # Prevent ADMIN from accidentally removing their own access.
    if str(membership["user_id"]) == str(current_user["id"]):
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account",
        )

    try:
        db.execute(
            text("""
                UPDATE company_users
                SET is_active = FALSE
                WHERE id = :company_user_id
                  AND company_id = :company_id
            """),
            {
                "company_user_id": company_user_id,
                "company_id": current_user["company_id"],
            },
        )

        db.execute(
            text("""
                UPDATE profiles
                SET is_active = FALSE
                WHERE id = :user_id
            """),
            {
                "user_id": membership["user_id"],
            },
        )

        db.commit()

        return {
            "message": "User deactivated successfully",
            "company_user_id": str(company_user_id),
        }

    except Exception as e:
        db.rollback()

        print("Error deactivating user:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to deactivate user",
        )
