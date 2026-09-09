from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from supabase import create_client

from app.core.config import settings
from app.core.database import get_db


# Normal Supabase client used for authentication
supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY,
)


# Admin Supabase client used for server-side user management
supabase_admin = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SECRET_KEY,
)


def get_current_user(
    authorization: str | None = Header(default=None),
):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )

    token = authorization.replace(
        "Bearer ",
        "",
        1,
    ).strip()

    try:
        print("AUTH: before get_user")

        response = supabase.auth.get_user(token)

        print("AUTH: after get_user")

        user = response.user

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )

        return user

    except HTTPException:
        raise

    except Exception as error:
        print("========== AUTH ERROR ==========")
        print("Error type:", type(error))
        print("Error:", repr(error))
        print("================================")

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )


def require_admin(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = text("""
        SELECT
            id,
            company_id,
            user_id,
            role,
            is_active
        FROM company_users
        WHERE user_id = :user_id
          AND is_active = true
        LIMIT 1
    """)

    membership = db.execute(
        query,
        {
            "user_id": str(
                current_user.id
            )
        },
    ).mappings().first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active company membership found",
        )

    if membership["role"] != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )

    return dict(membership)
