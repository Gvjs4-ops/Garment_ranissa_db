from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db

router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


class ProductCreate(BaseModel):
    sku: str
    style_code: str
    name: str
    fabric: str
    color: str
    size: str
    fit: str
    unit: str
    purchase_price: float
    selling_price: float
    is_active: bool = True


@router.get("")
def get_products(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            p.id,
            p.sku,
            p.style_code,
            p.name,
            p.category_id,
            p.description,
            p.fabric,
            p.fabric_composition,
            p.gsm,
            p.color,
            p.size,
            p.fit,
            p.unit,
            p.purchase_price,
            p.selling_price,
            p.is_active
        FROM products p
        ORDER BY p.created_at DESC
    """)

    result = db.execute(query).mappings().all()

    return [dict(row) for row in result]


@router.post("")
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
):
    query = text("""
        INSERT INTO products (
            sku,
            style_code,
            name,
            fabric,
            color,
            size,
            fit,
            unit,
            purchase_price,
            selling_price,
            is_active
        )
        VALUES (
            :sku,
            :style_code,
            :name,
            :fabric,
            :color,
            :size,
            :fit,
            :unit,
            :purchase_price,
            :selling_price,
            :is_active
        )
        RETURNING
            id,
            sku,
            style_code,
            name,
            category_id,
            description,
            fabric,
            fabric_composition,
            gsm,
            color,
            size,
            fit,
            unit,
            purchase_price,
            selling_price,
            is_active
    """)

    try:
        result = db.execute(
            query,
            {
                "sku": product.sku or None,
                "style_code": product.style_code or None,
                "name": product.name,
                "fabric": product.fabric or None,
                "color": product.color or None,
                "size": product.size or None,
                "fit": product.fit or None,
                "unit": product.unit,
                "purchase_price": product.purchase_price,
                "selling_price": product.selling_price,
                "is_active": product.is_active,
            },
        )

        new_product = result.mappings().one()

        db.commit()

        return dict(new_product)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="A product with this SKU already exists.",
        )

@router.put("/{product_id}")
def update_product(
    product_id: str,
    product: ProductCreate,
    db: Session = Depends(get_db),
):
    query = text("""
        UPDATE products
        SET
            sku = :sku,
            style_code = :style_code,
            name = :name,
            fabric = :fabric,
            color = :color,
            size = :size,
            fit = :fit,
            unit = :unit,
            purchase_price = :purchase_price,
            selling_price = :selling_price,
            is_active = :is_active,
            updated_at = NOW()
        WHERE id = :product_id
        RETURNING
            id,
            sku,
            style_code,
            name,
            category_id,
            description,
            fabric,
            fabric_composition,
            gsm,
            color,
            size,
            fit,
            unit,
            purchase_price,
            selling_price,
            is_active
    """)

    try:
        result = db.execute(
            query,
            {
                "product_id": product_id,
                "sku": product.sku or None,
                "style_code": product.style_code or None,
                "name": product.name,
                "fabric": product.fabric or None,
                "color": product.color or None,
                "size": product.size or None,
                "fit": product.fit or None,
                "unit": product.unit,
                "purchase_price": product.purchase_price,
                "selling_price": product.selling_price,
                "is_active": product.is_active,
            },
        )

        updated_product = result.mappings().one_or_none()

        if updated_product is None:
            db.rollback()
            raise HTTPException(
                status_code=404,
                detail="Product not found.",
            )

        db.commit()

        return dict(updated_product)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="A product with this SKU already exists.",
        )
