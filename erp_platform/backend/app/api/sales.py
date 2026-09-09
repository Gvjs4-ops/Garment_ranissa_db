from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db

router = APIRouter(
    prefix="/sales",
    tags=["Sales"],
)
from decimal import Decimal
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import date
from uuid import UUID

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
    credit_limit: float = 0


class CustomerUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    tax_number: str | None = None
    credit_limit: float | None = None
    is_active: bool | None = None

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

@router.post("/orders")
def create_sales_order(
    payload: SalesOrderCreate,
    db: Session = Depends(get_db),
):
    try:
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
                WHERE order_number LIKE 'SO-%'
                ORDER BY created_at DESC
                LIMIT 1
            """)
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
            total_amount
        )
        VALUES (
            :company_id,
            :customer_id,
            :order_number,
            :order_date,
            'DRAFT',
            0
        )
        RETURNING
            id,
            company_id,
            customer_id,
            order_number,
            order_date,
            status,
            total_amount
    """),
    {
        "company_id": payload.company_id,
        "customer_id": payload.customer_id,
        "order_number": order_number,
        "order_date": payload.order_date,
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
def get_sales_orders(db: Session = Depends(get_db)):
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

            GROUP BY
                so.id,
                so.order_number,
                so.order_date,
                so.status,
                so.customer_id,
                c.name

            ORDER BY so.created_at DESC
        """)

        results = db.execute(query).mappings().all()

        return [dict(row) for row in results]

    except Exception as e:
        print("Error fetching sales orders:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to fetch sales orders"
        )

@router.get("/orders/{order_id}")
def get_sales_order(
    order_id: UUID,
    db: Session = Depends(get_db),
):
    try:
        order_query = text("""
            SELECT
                so.id,
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
        """)

        order = db.execute(
            order_query,
            {"order_id": order_id},
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
            {"order_id": order_id},
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

@router.post("/orders/{order_id}/items")
def create_sales_order_item(
    order_id: UUID,
    payload: SalesOrderItemCreate,
    db: Session = Depends(get_db),
):
    order_exists = db.execute(
        text("""
            SELECT id
            FROM sales_orders
            WHERE id = :order_id
        """),
        {"order_id": order_id},
    ).first()

    if not order_exists:
        raise HTTPException(
            status_code=404,
            detail="Sales order not found",
        )

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

@router.patch("/orders/{order_id}")
def update_sales_order(
    order_id: UUID,
    payload: SalesOrderUpdate,
    db: Session = Depends(get_db),
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
            """),
            {"order_id": order_id},
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

        updated = db.execute(
            text("""
                UPDATE sales_orders
                SET
                    customer_id = :customer_id,
                    order_date = :order_date,
                    status = :status,
                    updated_at = NOW()
                WHERE id = :order_id
                RETURNING
                    id,
                    order_number,
                    customer_id,
                    order_date,
                    status,
                    total_amount
            """),
            {
                "order_id": order_id,
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
):
    existing = db.execute(
        text("""
            SELECT
                id,
                quantity,
                unit_price
            FROM sales_order_items
            WHERE id = :item_id
              AND sales_order_id = :order_id
        """),
        {
            "item_id": item_id,
            "order_id": order_id,
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

@router.delete("/orders/{order_id}")
def delete_sales_order(
    order_id: UUID,
    db: Session = Depends(get_db),
):
    order = db.execute(
        text("""
            SELECT id, status
            FROM sales_orders
            WHERE id = :order_id
        """),
        {"order_id": order_id},
    ).mappings().first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Sales order not found",
        )

    if order["status"] not in ("DRAFT", "CONFIRMED"):
        raise HTTPException(
            status_code=400,
            detail="Only DRAFT or CONFIRMED sales orders can be deleted",
        )

    db.execute(
        text("""
            DELETE FROM sales_order_items
            WHERE sales_order_id = :order_id
        """),
        {"order_id": order_id},
    )

    db.execute(
        text("""
            DELETE FROM sales_orders
            WHERE id = :order_id
        """),
        {"order_id": order_id},
    )

    db.commit()

    return {
        "message": "Sales order deleted",
        "id": str(order_id),
    }

@router.delete("/orders/{order_id}/items/{item_id}")
def delete_sales_order_item(
    order_id: UUID,
    item_id: UUID,
    db: Session = Depends(get_db),
):
    deleted = db.execute(
        text("""
            DELETE FROM sales_order_items
            WHERE id = :item_id
              AND sales_order_id = :order_id
            RETURNING id
        """),
        {
            "item_id": item_id,
            "order_id": order_id,
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

@router.get("/orders/{order_id}/availability")
def get_sales_order_availability(
    order_id: UUID,
    db: Session = Depends(get_db),
):
    order = db.execute(
        text("""
            SELECT id, order_number, status
            FROM sales_orders
            WHERE id = :order_id
        """),
        {"order_id": order_id},
    ).mappings().first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Sales order not found",
        )

    items = db.execute(
        text("""
            SELECT
                soi.id AS sales_order_item_id,
                soi.product_id,
                p.name AS product_name,
                p.sku,
                p.color,
                p.size,
                soi.quantity AS ordered_quantity,

                COALESCE(SUM(i.quantity_on_hand), 0)
                    AS quantity_on_hand,

                COALESCE(SUM(i.quantity_reserved), 0)
                    AS quantity_reserved,

                COALESCE(
                    SUM(
                        i.quantity_on_hand -
                        i.quantity_reserved
                    ),
                    0
                ) AS available_quantity

            FROM sales_order_items soi

            LEFT JOIN products p
                ON p.id = soi.product_id

            LEFT JOIN inventory i
                ON i.product_id = soi.product_id

            WHERE soi.sales_order_id = :order_id

            GROUP BY
                soi.id,
                soi.product_id,
                p.name,
                p.sku,
                p.color,
                p.size,
                soi.quantity

            ORDER BY soi.created_at
        """),
        {"order_id": order_id},
    ).mappings().all()

    result_items = []
    can_fulfill_completely = True

    for item in items:
        ordered = float(item["ordered_quantity"])
        available = float(item["available_quantity"])

        shortage = max(
            ordered - available,
            0
        )

        if shortage > 0:
            status = "SHORTAGE"
            can_fulfill_completely = False
        else:
            status = "AVAILABLE"

        result_items.append({
            "sales_order_item_id":
                str(item["sales_order_item_id"]),

            "product_id":
                str(item["product_id"]),

            "product_name":
                item["product_name"],

            "sku":
                item["sku"],

            "color":
                item["color"],

            "size":
                item["size"],

            "ordered_quantity":
                ordered,

            "quantity_on_hand":
                float(item["quantity_on_hand"]),

            "quantity_reserved":
                float(item["quantity_reserved"]),

            "available_quantity":
                available,

            "shortage_quantity":
                shortage,

            "status":
                status,
        })

    return {
        "order_id": str(order["id"]),
        "order_number": order["order_number"],
        "order_status": order["status"],
        "can_fulfill_completely":
            can_fulfill_completely,
        "items": result_items,
    }

@router.post("/orders/{order_id}/approve")
def approve_sales_order(
    order_id: UUID,
    db: Session = Depends(get_db),
):
    order = db.execute(
        text("""
            SELECT
                id,
                company_id,
                status
            FROM sales_orders
            WHERE id = :order_id
        """),
        {"order_id": order_id},
    ).mappings().first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Sales order not found",
        )

    if order["status"] != "CONFIRMED":
        raise HTTPException(
            status_code=400,
            detail="Only CONFIRMED sales orders can be approved",
        )

    items = db.execute(
        text("""
            SELECT
                id,
                product_id,
                quantity
            FROM sales_order_items
            WHERE sales_order_id = :order_id
            ORDER BY created_at
        """),
        {"order_id": order_id},
    ).mappings().all()

    if not items:
        raise HTTPException(
            status_code=400,
            detail="Sales order has no items",
        )

    try:
        for item in items:
            required_qty = float(item["quantity"])

            inventory_rows = db.execute(
                text("""
                    SELECT
                        id,
                        warehouse_id,
                        quantity_on_hand,
                        quantity_reserved
                    FROM inventory
                    WHERE product_id = :product_id
                    ORDER BY created_at
                    FOR UPDATE
                """),
                {
                    "product_id": item["product_id"],
                },
            ).mappings().all()

            remaining_qty = required_qty

            for inventory_row in inventory_rows:
                available_qty = max(
                    float(inventory_row["quantity_on_hand"])
                    - float(inventory_row["quantity_reserved"]),
                    0,
                )

                if available_qty <= 0:
                    continue

                reserve_qty = min(
                    remaining_qty,
                    available_qty,
                )

                db.execute(
                    text("""
                        UPDATE inventory
                        SET
                            quantity_reserved =
                                quantity_reserved + :reserve_qty,
                            updated_at = now()
                        WHERE id = :inventory_id
                    """),
                    {
                        "reserve_qty": reserve_qty,
                        "inventory_id": inventory_row["id"],
                    },
                )

                db.execute(
                    text("""
                        INSERT INTO inventory_transactions (
                            product_id,
                            warehouse_id,
                            transaction_type,
                            quantity,
                            reference_type,
                            reference_id,
                            notes
                        )
                        VALUES (
                            :product_id,
                            :warehouse_id,
                            'RESERVATION',
                            :quantity,
                            'SALES_ORDER',
                            :reference_id,
                            :notes
                        )
                    """),
                    {
                        "product_id": item["product_id"],
                        "warehouse_id":
                            inventory_row["warehouse_id"],
                        "quantity": reserve_qty,
                        "reference_id": order_id,
                        "notes":
                            "Reserved for approved sales order",
                    },
                )

                remaining_qty -= reserve_qty

                if remaining_qty <= 0:
                    break

            if remaining_qty > 0:
                db.execute(
                    text("""
                        INSERT INTO production_requirements (
                            company_id,
                            sales_order_id,
                            sales_order_item_id,
                            product_id,
                            required_quantity,
                            status
                        )
                        VALUES (
                            :company_id,
                            :sales_order_id,
                            :sales_order_item_id,
                            :product_id,
                            :required_quantity,
                            'PENDING'
                        )
                    """),
                    {
                        "company_id":
                            order["company_id"],
                        "sales_order_id":
                            order_id,
                        "sales_order_item_id":
                            item["id"],
                        "product_id":
                            item["product_id"],
                        "required_quantity":
                            remaining_qty,
                    },
                )

        db.execute(
            text("""
                UPDATE sales_orders
                SET status = 'APPROVED'
                WHERE id = :order_id
            """),
            {
                "order_id": order_id,
            },
        )

        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Sales order approved",
        "order_id": str(order_id),
        "status": "APPROVED",
    }

@router.get("/products")
def get_sales_products(
    db: Session = Depends(get_db),
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

@router.get("/customers")
def get_sales_customers(
    db: Session = Depends(get_db),
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
):
    try:
        existing = db.execute(
            text("""
                SELECT *
                FROM customers
                WHERE id = :customer_id
            """),
            {"customer_id": customer_id},
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
            "tax_number": data.get("tax_number", existing["tax_number"]),
            "gst_number": data.get("gst_number", existing["gst_number"]),
            "credit_limit": data.get("credit_limit",existing["credit_limit"]),
            "is_active": data.get("is_active",existing["is_active"]),
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

@router.get("/companies")
def get_companies(
    db: Session = Depends(get_db),
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
                    currency_code,
                    timezone,
                    is_active
                FROM companies
                WHERE is_active = TRUE
                ORDER BY name
            """)
        ).mappings().all()

        return [dict(company) for company in companies]

    except Exception as e:
        print("Error fetching companies:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to fetch companies",
        )
