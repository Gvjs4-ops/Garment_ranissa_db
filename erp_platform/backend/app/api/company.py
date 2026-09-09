from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db


router = APIRouter(
    prefix="/company",
    tags=["Company"],
)


class CompanyUpdate(BaseModel):
    name: str
    legal_name: str | None = None
    email: str | None = None
    phone: str | None = None
    tax_number: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None


@router.get("")
def get_company(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            id,

            display_name AS name,
            legal_name,
            email,
            phone,

            tax_id AS tax_number,

            address_line_1 AS address,

            city,
            state,
            country,
            postal_code,

            company_code,
            trade_name,
            business_type,
            industry,
            registration_number,
            website,
            currency_code,
            timezone,

            is_active

        FROM companies

        WHERE is_active = true

        ORDER BY created_at

        LIMIT 1
    """)

    company = db.execute(query).mappings().first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found.",
        )

    return dict(company)


@router.put("")
def update_company(
    company: CompanyUpdate,
    db: Session = Depends(get_db),
):
    if not company.name.strip():
        raise HTTPException(
            status_code=400,
            detail="Company name is required.",
        )

    current_query = text("""
        SELECT id
        FROM companies
        WHERE is_active = true
        ORDER BY created_at
        LIMIT 1
    """)

    current = db.execute(
        current_query
    ).mappings().first()

    if not current:
        raise HTTPException(
            status_code=404,
            detail="Company not found.",
        )

    try:
        update_query = text("""
            UPDATE companies
            SET
                display_name = :name,
                legal_name = :legal_name,
                email = :email,
                phone = :phone,

                tax_id = :tax_number,

                address_line_1 = :address,

                city = :city,
                state = :state,
                country = :country,
                postal_code = :postal_code,

                updated_at = NOW()

            WHERE id = :company_id

            RETURNING
                id,

                display_name AS name,
                legal_name,
                email,
                phone,

                tax_id AS tax_number,

                address_line_1 AS address,

                city,
                state,
                country,
                postal_code,

                company_code,
                trade_name,
                business_type,
                industry,
                registration_number,
                website,
                currency_code,
                timezone,

                is_active
        """)

        updated = db.execute(
            update_query,
            {
                "company_id": current["id"],

                "name": company.name,
                "legal_name": company.legal_name,
                "email": company.email,
                "phone": company.phone,

                "tax_number": company.tax_number,

                "address": company.address,

                "city": company.city,
                "state": company.state,
                "country": company.country,
                "postal_code": company.postal_code,
            },
        ).mappings().first()

        db.commit()

        return dict(updated)

    except Exception:
        db.rollback()
        raise
