from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.get("/summary")
def get_reports_summary(
    db: Session = Depends(get_db),
):
    totals_query = text("""
        SELECT
            COALESCE(
                (
                    SELECT SUM(total_amount)
                    FROM sales_orders
                    WHERE status <> 'CANCELLED'
                ),
                0
            ) AS total_sales,

            (
                SELECT COUNT(*)
                FROM sales_orders
            ) AS total_orders,

            (
                SELECT COUNT(*)
                FROM products
                WHERE is_active = true
            ) AS total_products,

            COALESCE(
                (
                    SELECT SUM(quantity_on_hand)
                    FROM inventory
                ),
                0
            ) AS total_inventory,

            (
                SELECT COUNT(*)
                FROM inventory
                WHERE
                    (quantity_on_hand - quantity_reserved)
                    <= reorder_level
            ) AS low_stock_count
    """)

    totals = db.execute(
        totals_query
    ).mappings().one()


    recent_orders_query = text("""
        SELECT
            so.id,
            so.order_number,
            so.order_date,
            COALESCE(c.name, 'Unknown Customer')
                AS customer_name,
            so.status,
            so.total_amount

        FROM sales_orders so

        LEFT JOIN customers c
            ON c.id = so.customer_id

        ORDER BY
            so.order_date DESC,
            so.created_at DESC

        LIMIT 10
    """)

    recent_orders = db.execute(
        recent_orders_query
    ).mappings().all()

    top_products_query = text("""
        SELECT
            p.id AS product_id,
            p.sku,
            p.name AS product_name,
    
            COALESCE(
                SUM(soi.quantity),
                0
            ) AS quantity_sold,
    
            COALESCE(
                SUM(soi.line_total),
                0
            ) AS sales_amount
    
        FROM sales_order_items soi
    
        JOIN sales_orders so
            ON so.id = soi.sales_order_id
    
        JOIN products p
            ON p.id = soi.product_id
    
        WHERE so.status <> 'CANCELLED'
    
        GROUP BY
            p.id,
            p.sku,
            p.name
    
        ORDER BY
            quantity_sold DESC,
            sales_amount DESC
    
        LIMIT 10
    """)

    top_products = db.execute(
        top_products_query
    ).mappings().all()


    low_stock_query = text("""
        SELECT
            i.id AS inventory_id,
            p.sku,
            p.name AS product_name,
            w.name AS warehouse_name,

            (
                i.quantity_on_hand
                - i.quantity_reserved
            ) AS quantity_available,

            i.reorder_level

        FROM inventory i

        JOIN products p
            ON p.id = i.product_id

        JOIN warehouses w
            ON w.id = i.warehouse_id

        WHERE
            (
                i.quantity_on_hand
                - i.quantity_reserved
            ) <= i.reorder_level

        ORDER BY
            quantity_available ASC,
            p.name ASC
    """)

    low_stock_items = db.execute(
        low_stock_query
    ).mappings().all()


    return {
        "total_sales": float(
            totals["total_sales"] or 0
        ),

        "total_orders": int(
            totals["total_orders"] or 0
        ),

        "total_products": int(
            totals["total_products"] or 0
        ),

        "total_inventory": float(
            totals["total_inventory"] or 0
        ),

        "low_stock_count": int(
            totals["low_stock_count"] or 0
        ),

        "recent_orders": [
            dict(row)
            for row in recent_orders
        ],

        "top_products": [
            dict(row)
            for row in top_products
        ],

        "low_stock_items": [
            dict(row)
            for row in low_stock_items
        ],
    }
