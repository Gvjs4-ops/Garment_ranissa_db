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
    prefix="/sales",
    tags=["Sales"],
)


# -------------------------------------------------------------------
# Request models
# -------------------------------------------------------------------

class SalesOrderCreate(BaseModel):
    company_id: UUID
    customer_id: UUID
    order_date: date


class SalesOrderUpdate(BaseModel):
    customer_id: UUID | None = None
    order_date: date | None = None
    status: str | None = None


class SalesOrderItemCreate(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(gt=0)
    unit_price: Decimal = Field(ge=0)


class SalesOrderItemUpdate(BaseModel):
    quantity: Decimal | None = Field(default=None, gt=0)
    unit_price: Decimal | None = Field(default=None, ge=0)


class CustomerCreate(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    tax_number: str | None = None
    gst_number: str | None = None
    credit_limit: float = 0


class CustomerUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    tax_number: str | None = None
    gst_number: str | None = None
    credit_limit: float | None = None
    is_active: bool | None = None


# -------------------------------------------------------------------
# Sales orders
# -------------------------------------------------------------------

@router.post("/orders")
def create_sales_order(
    payload: SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "ADMIN",
            "SALES_MANAGER",
            "SALES_EXECUTIVE",
        )
    ),
):
    try:
        # Never trust company_id supplied by the frontend.
        if str(payload.company_id) != str(current_user["company_id"]):
            raise HTTPException(
                status_code=403,
                detail="You cannot create an order for another company",
            )

        customer = db.execute(
            text("""
                SELECT id
                FROM customers
                WHERE id = :customer_id
                  AND is_active = TRUE
            """),
            {
                "customer_id": payload.customer_id,
            },
        ).first()

        if not customer:
            raise HTTPException(
                status_code=400,
                detail="Invalid or inactive customer",
            )

        latest_number = db.execute(
            text("""
                SELECT order_number
                FROM sales_orders
                WHERE company_id = :company_id
                  AND order_number LIKE 'SO-%'
                ORDER BY created_at DESC
                LIMIT 1
            """),
            {
                "company_id": current_user["company_id"],
            },
        ).scalar()

        next_number = 1

        if latest_number:
            try:
                next_number = int(
                    latest_number.split("-")[-1]
                ) + 1
            except ValueError:
                next_number = 1

        order_number = f"SO-{next_number:06d}"

        order = db.execute(
            text("""
                INSERT INTO sales_orders (
                    company_id,
                    customer_id,
                    order_number,
                    order_date,
                    status,
                    total_amount,
                    created_by
                )
                VALUES (
                    :company_id,
                    :customer_id,
                    :order_number,
                    :order_date,
                    'DRAFT',
                    0,
                    :created_by
                )
                RETURNING
                    id,
                    company_id,
                    customer_id,
                    order_number,
                    order_date,
                    status,
                    total_amount,
                    created_by
            """),
            {
                "company_id": current_user["company_id"],
                "customer_id": payload.customer_id,
                "order_number": order_number,
                "order_date": payload.order_date,
                "created_by": current_user["id"],
            },
        ).mappings().one()

        db.commit()

        return dict(order)

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        print("Error creating sales order:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to create sales order",
        )


@router.get("/orders")
def get_sales_orders(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        query = text("""
            SELECT
                so.id,
                so.order_number,
                so.order_date,
                so.status,
                COALESCE(
                    SUM(soi.quantity * soi.unit_price),
                    0
                ) AS total_amount,
                so.customer_id,
                c.name AS customer_name
            FROM sales_orders so

            LEFT JOIN customers c
                ON c.id = so.customer_id

            LEFT JOIN sales_order_items soi
                ON soi.sales_order_id = so.id

            WHERE so.company_id = :company_id

            GROUP BY
                so.id,
                so.order_number,
                so.order_date,
                so.status,
                so.customer_id,
                c.name,
                so.created_at

            ORDER BY so.created_at DESC
        """)

        results = db.execute(
            query,
            {
                "company_id": current_user["company_id"],
            },
        ).mappings().all()

        return [dict(row) for row in results]

    except Exception as e:
        print("Error fetching sales orders:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to fetch sales orders",
        )


@router.get("/orders/{order_id}")
def get_sales_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        order_query = text("""
            SELECT
                so.id,
                so.company_id,
                so.order_number,
                so.order_date,
                so.status,
                so.total_amount,
                so.customer_id,
                c.name AS customer_name
            FROM sales_orders so
            JOIN customers c
                ON c.id = so.customer_id
            WHERE so.id = :order_id
              AND so.company_id = :company_id
        """)

        order = db.execute(
            order_query,
            {
                "order_id": order_id,
                "company_id": current_user["company_id"],
            },
        ).mappings().first()

        if not order:
            raise HTTPException(
                status_code=404,
                detail="Sales order not found",
            )

        items_query = text("""
            SELECT
                soi.id,
                soi.product_id,
                p.sku,
                p.style_code,
                p.name AS product_name,
                p.color,
                p.size,
                soi.quantity,
                soi.unit_price,
                soi.line_total
            FROM sales_order_items soi
            LEFT JOIN products p
                ON p.id = soi.product_id
            WHERE soi.sales_order_id = :order_id
            ORDER BY soi.created_at, soi.id
        """)

        items = db.execute(
            items_query,
            {
                "order_id": order_id,
            },
        ).mappings().all()

        response = dict(order)
        response["items"] = [
            dict(item)
            for item in items
        ]

        return response

    except HTTPException:
        raise

    except Exception as e:
        print("Error fetching sales order:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to fetch sales order",
        )


# -------------------------------------------------------------------
# Sales order items
# -------------------------------------------------------------------

@router.post("/orders/{order_id}/items")
def create_sales_order_item(
    order_id: UUID,
    payload: SalesOrderItemCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "ADMIN",
            "SALES_MANAGER",
            "SALES_EXECUTIVE",
        )
    ),
):
    order_exists = db.execute(
        text("""
            SELECT id
            FROM sales_orders
            WHERE id = :order_id
              AND company_id = :company_id
        """),
        {
            "order_id": order_id,
            "company_id": current_user["company_id"],
        },
    ).first()

    if not order_exists:
        raise HTTPException(
            status_code=404,
            detail="Sales order not found",
        )

    product_exists = db.execute(
        text("""
            SELECT id
            FROM products
            WHERE id = :product_id
              AND is_active = TRUE
        """),
        {
            "product_id": payload.product_id,
        },
    ).first()

    if not product_exists:
        raise HTTPException(
            status_code=400,
            detail="Invalid or inactive product",
        )

    try:
        row = db.execute(
            text("""
                INSERT INTO sales_order_items (
                    sales_order_id,
                    product_id,
                    quantity,
                    unit_price
                )
                VALUES (
                    :sales_order_id,
                    :product_id,
                    :quantity,
                    :unit_price
                )
                RETURNING
                    id,
                    sales_order_id,
                    product_id,
                    quantity,
                    unit_price,
                    line_total
            """),
            {
                "sales_order_id": order_id,
                "product_id": payload.product_id,
                "quantity": payload.quantity,
                "unit_price": payload.unit_price,
            },
        ).mappings().one()

        db.commit()

        return dict(row)

    except Exception as e:
        db.rollback()

        print("Error creating sales order item:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to create sales order item",
        )


@router.patch("/orders/{order_id}")
def update_sales_order(
    order_id: UUID,
    payload: SalesOrderUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "ADMIN",
            "SALES_MANAGER",
            "SALES_EXECUTIVE",
        )
    ),
):
    try:
        existing = db.execute(
            text("""
                SELECT
                    id,
                    customer_id,
                    order_date,
                    status
                FROM sales_orders
                WHERE id = :order_id
                  AND company_id = :company_id
            """),
            {
                "order_id": order_id,
                "company_id": current_user["company_id"],
            },
        ).mappings().first()

        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Sales order not found",
            )

        customer_id = (
            payload.customer_id
            if payload.customer_id is not None
            else existing["customer_id"]
        )

        order_date = (
            payload.order_date
            if payload.order_date is not None
            else existing["order_date"]
        )

        status = (
            payload.status
            if payload.status is not None
            else existing["status"]
        )

        customer = db.execute(
            text("""
                SELECT id
                FROM customers
                WHERE id = :customer_id
                  AND is_active = TRUE
            """),
            {
                "customer_id": customer_id,
            },
        ).first()

        if not customer:
            raise HTTPException(
                status_code=400,
                detail="Invalid or inactive customer",
            )

        updated = db.execute(
            text("""
                UPDATE sales_orders
                SET
                    customer_id = :customer_id,
                    order_date = :order_date,
                    status = :status,
                    updated_at = NOW()
                WHERE id = :order_id
                  AND company_id = :company_id
                RETURNING
                    id,
                    company_id,
                    order_number,
                    customer_id,
                    order_date,
                    status,
                    total_amount
            """),
            {
                "order_id": order_id,
                "company_id": current_user["company_id"],
                "customer_id": customer_id,
                "order_date": order_date,
                "status": status,
            },
        ).mappings().one()

        db.commit()

        return dict(updated)

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        print("Error updating sales order:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to update sales order",
        )


@router.patch("/orders/{order_id}/items/{item_id}")
def update_sales_order_item(
    order_id: UUID,
    item_id: UUID,
    payload: SalesOrderItemUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "ADMIN",
            "SALES_MANAGER",
            "SALES_EXECUTIVE",
        )
    ),
):
    existing = db.execute(
        text("""
            SELECT
                soi.id,
                soi.quantity,
                soi.unit_price
            FROM sales_order_items soi
            JOIN sales_orders so
                ON so.id = soi.sales_order_id
            WHERE soi.id = :item_id
              AND soi.sales_order_id = :order_id
              AND so.company_id = :company_id
        """),
        {
            "item_id": item_id,
            "order_id": order_id,
            "company_id": current_user["company_id"],
        },
    ).mappings().first()

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Sales order item not found",
        )

    quantity = (
        payload.quantity
        if payload.quantity is not None
        else existing["quantity"]
    )

    unit_price = (
        payload.unit_price
        if payload.unit_price is not None
        else existing["unit_price"]
    )

    try:
        row = db.execute(
            text("""
                UPDATE sales_order_items
                SET
                    quantity = :quantity,
                    unit_price = :unit_price
                WHERE id = :item_id
                  AND sales_order_id = :order_id
                RETURNING
                    id,
                    sales_order_id,
                    product_id,
                    quantity,
                    unit_price,
                    line_total
            """),
            {
                "quantity": quantity,
                "unit_price": unit_price,
                "item_id": item_id,
                "order_id": order_id,
            },
        ).mappings().one()

        db.commit()

        return dict(row)

    except Exception as e:
        db.rollback()

        print("Error updating sales order item:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to update sales order item",
        )


@router.delete("/orders/{order_id}/items/{item_id}")
def delete_sales_order_item(
    order_id: UUID,
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "ADMIN",
            "SALES_MANAGER",
        )
    ),
):
    deleted = db.execute(
        text("""
            DELETE FROM sales_order_items soi
            USING sales_orders so
            WHERE soi.id = :item_id
              AND soi.sales_order_id = :order_id
              AND so.id = soi.sales_order_id
              AND so.company_id = :company_id
            RETURNING soi.id
        """),
        {
            "item_id": item_id,
            "order_id": order_id,
            "company_id": current_user["company_id"],
        },
    ).first()

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Sales order item not found",
        )

    db.commit()

    return {
        "message": "Sales order item deleted",
        "id": str(item_id),
    }


# -------------------------------------------------------------------
# Products available to Sales
# -------------------------------------------------------------------

@router.get("/products")
def get_sales_products(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        products = db.execute(
            text("""
                SELECT
                    id,
                    sku,
                    style_code,
                    name AS product_name,
                    color,
                    size,
                    selling_price
                FROM products
                WHERE is_active = TRUE
                ORDER BY name, color, size
            """)
        ).mappings().all()

        return [dict(product) for product in products]

    except Exception as e:
        print("Error fetching products:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to fetch products",
        )


# -------------------------------------------------------------------
# Customers
# -------------------------------------------------------------------

@router.get("/customers")
def get_sales_customers(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        customers = db.execute(
            text("""
                SELECT
                    id,
                    name,
                    phone,
                    email,
                    address,
                    tax_number,
                    gst_number,
                    credit_limit,
                    is_active
                FROM customers
                ORDER BY name
            """)
        ).mappings().all()

        return [dict(customer) for customer in customers]

    except Exception as e:
        print("Error fetching customers:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to fetch customers",
        )


@router.post("/customers")
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "ADMIN",
            "SALES_MANAGER",
            "SALES_EXECUTIVE",
        )
    ),
):
    try:
        customer = db.execute(
            text("""
                INSERT INTO customers (
                    name,
                    phone,
                    email,
                    address,
                    tax_number,
                    gst_number,
                    credit_limit,
                    is_active
                )
                VALUES (
                    :name,
                    :phone,
                    :email,
                    :address,
                    :tax_number,
                    :gst_number,
                    :credit_limit,
                    TRUE
                )
                RETURNING
                    id,
                    name,
                    phone,
                    email,
                    address,
                    tax_number,
                    gst_number,
                    credit_limit,
                    is_active
            """),
            payload.model_dump(),
        ).mappings().one()

        db.commit()

        return dict(customer)

    except Exception as e:
        db.rollback()

        print("Error creating customer:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to create customer",
        )


@router.patch("/customers/{customer_id}")
def update_customer(
    customer_id: UUID,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "ADMIN",
            "SALES_MANAGER",
            "SALES_EXECUTIVE",
        )
    ),
):
    try:
        existing = db.execute(
            text("""
                SELECT *
                FROM customers
                WHERE id = :customer_id
            """),
            {
                "customer_id": customer_id,
            },
        ).mappings().first()

        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Customer not found",
            )

        data = payload.model_dump(exclude_unset=True)

        updated = {
            "name": data.get("name", existing["name"]),
            "phone": data.get("phone", existing["phone"]),
            "email": data.get("email", existing["email"]),
            "address": data.get("address", existing["address"]),
            "tax_number": data.get(
                "tax_number",
                existing["tax_number"],
            ),
            "gst_number": data.get(
                "gst_number",
                existing["gst_number"],
            ),
            "credit_limit": data.get(
                "credit_limit",
                existing["credit_limit"],
            ),
            "is_active": data.get(
                "is_active",
                existing["is_active"],
            ),
        }

        customer = db.execute(
            text("""
                UPDATE customers
                SET
                    name = :name,
                    phone = :phone,
                    email = :email,
                    address = :address,
                    tax_number = :tax_number,
                    gst_number = :gst_number,
                    credit_limit = :credit_limit,
                    is_active = :is_active,
                    updated_at = NOW()
                WHERE id = :customer_id
                RETURNING
                    id,
                    name,
                    phone,
                    email,
                    address,
                    tax_number,
                    gst_number,
                    credit_limit,
                    is_active
            """),
            {
                "customer_id": customer_id,
                **updated,
            },
        ).mappings().one()

        db.commit()

        return dict(customer)

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        print("Error updating customer:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to update customer",
        )


# -------------------------------------------------------------------
# Companies
# -------------------------------------------------------------------

@router.get("/companies")
def get_companies(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        companies = db.execute(
            text("""
                SELECT
                    id,
                    company_code,
                    display_name AS name,
                    legal_name,
                    trade_name,
                    business_type,
                    industry,
                    tax_id,
                    registration_number,
                    email,
                    phone,
                    website,
                    address_line_1,
                    address_line_2,
                    city,
                    state,
                    country,
                    postal_code,
                    currency_code,
                    timezone,
                    fiscal_year_start_month,
                    is_active
                FROM companies
                WHERE id = :company_id
                  AND is_active = TRUE
            """),
            {
                "company_id": current_user["company_id"],
            },
        ).mappings().all()

        return [dict(company) for company in companies]

    except Exception as e:
        print("Error fetching companies:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to fetch companies",
        )


@router.put("/companies/{company_id}")
def update_company(
    company_id: UUID,
    company: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    if str(company_id) != str(current_user["company_id"]):
        raise HTTPException(
            status_code=403,
            detail="You cannot update another company",
        )

    try:
        existing = db.execute(
            text("""
                SELECT id
                FROM companies
                WHERE id = :company_id
                  AND is_active = TRUE
            """),
            {
                "company_id": company_id,
            },
        ).mappings().first()

        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Company not found",
            )

        result = db.execute(
            text("""
                UPDATE companies
                SET
                    display_name = :display_name,
                    legal_name = :legal_name,
                    trade_name = :trade_name,
                    business_type = :business_type,
                    industry = :industry,
                    tax_id = :tax_id,
                    registration_number = :registration_number,
                    email = :email,
                    phone = :phone,
                    website = :website,
                    address_line_1 = :address_line_1,
                    address_line_2 = :address_line_2,
                    city = :city,
                    state = :state,
                    country = :country,
                    postal_code = :postal_code,
                    currency_code = :currency_code,
                    timezone = :timezone,
                    fiscal_year_start_month = :fiscal_year_start_month,
                    updated_at = NOW()
                WHERE id = :company_id
                  AND is_active = TRUE
                RETURNING
                    id,
                    company_code,
                    display_name AS name,
                    legal_name,
                    trade_name,
                    business_type,
                    industry,
                    tax_id,
                    registration_number,
                    email,
                    phone,
                    website,
                    address_line_1,
                    address_line_2,
                    city,
                    state,
                    country,
                    postal_code,
                    currency_code,
                    timezone,
                    fiscal_year_start_month,
                    is_active
            """),
            {
                "company_id": company_id,
                "display_name": company.get("display_name"),
                "legal_name": company.get("legal_name"),
                "trade_name": company.get("trade_name"),
                "business_type": company.get("business_type"),
                "industry": company.get("industry"),
                "tax_id": company.get("tax_id"),
                "registration_number": company.get(
                    "registration_number"
                ),
                "email": company.get("email"),
                "phone": company.get("phone"),
                "website": company.get("website"),
                "address_line_1": company.get("address_line_1"),
                "address_line_2": company.get("address_line_2"),
                "city": company.get("city"),
                "state": company.get("state"),
                "country": company.get("country"),
                "postal_code": company.get("postal_code"),
                "currency_code": company.get("currency_code"),
                "timezone": company.get("timezone"),
                "fiscal_year_start_month": company.get(
                    "fiscal_year_start_month"
                ),
            },
        )

        db.commit()

        updated_company = result.mappings().first()

        return dict(updated_company)

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        print("Error updating company:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to update company",
        )
