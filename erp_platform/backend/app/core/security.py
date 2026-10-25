from uuid import UUID

import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db


bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    try:
        response = httpx.get(
            f"{settings.SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": settings.SUPABASE_KEY,
                "Authorization": f"Bearer {token}",
            },
            timeout=10,
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired authentication token",
            )

        auth_user = response.json()
        user_id = auth_user.get("id")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication user",
            )

        membership = db.execute(
            text("""
                SELECT
                    cu.id AS company_user_id,
                    cu.user_id,
                    cu.company_id,
                    cu.role,
                    cu.is_active,
                    c.display_name AS company_name
                FROM company_users cu
                JOIN companies c
                    ON c.id = cu.company_id
                WHERE cu.user_id = :user_id
                  AND cu.is_active = TRUE
                  AND c.is_active = TRUE
                ORDER BY cu.joined_at
                LIMIT 1
            """),
            {
                "user_id": user_id,
            },
        ).mappings().first()

        if not membership:
            raise HTTPException(
                status_code=403,
                detail="User is not an active company member",
            )

        return {
            "id": UUID(user_id),
            "email": auth_user.get("email"),
            "company_user_id": membership["company_user_id"],
            "company_id": membership["company_id"],
            "company_name": membership["company_name"],
            "role": membership["role"],
        }

    except HTTPException:
        raise

    except httpx.RequestError as e:
        print("Supabase authentication error:", e)

        raise HTTPException(
            status_code=503,
            detail="Authentication service unavailable",
        )

    except Exception as e:
        print("Authentication error:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to authenticate user",
        )


def require_roles(*allowed_roles: str):
    def role_dependency(
        current_user=Depends(get_current_user),
    ):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to perform this action",
            )

        return current_user

    return role_dependency
