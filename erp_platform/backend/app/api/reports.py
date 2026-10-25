from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.get("/summary")
def get_reports_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Reports are available to all authenticated users.

    Sales-related reports are restricted to the user's company.

    Products and inventory are currently global because their
    underlying tables do not have a company_id column.
    """

    company_id = current_user["company_id"]

    try:
        # ---------------------------------------------------------
        # TOTAL SALES
        # ---------------------------------------------------------
        total_sales_query = text("""
            SELECT
                COALESCE(
                    SUM(soi.quantity * soi.unit_price),
                    0
                ) AS total_sales
            FROM sales_orders so
            LEFT JOIN sales_order_items soi
                ON soi.sales_order_id = so.id
            WHERE so.company_id = :company_id
              AND COALESCE(UPPER(so.status), '') NOT IN (
                  'CANCELLED',
                  'REJECTED'
              )
        """)

        total_sales = db.execute(
            total_sales_query,
            {
                "company_id": company_id,
            },
        ).scalar() or 0

        # ---------------------------------------------------------
        # TOTAL ORDERS
        # ---------------------------------------------------------
        total_orders_query = text("""
            SELECT COUNT(*)
            FROM sales_orders
            WHERE company_id = :company_id
              AND COALESCE(UPPER(status), '') NOT IN (
                  'CANCELLED',
                  'REJECTED'
              )
        """)

        total_orders = db.execute(
            total_orders_query,
            {
                "company_id": company_id,
            },
        ).scalar() or 0

        # ---------------------------------------------------------
        # TOTAL ACTIVE PRODUCTS
        # ---------------------------------------------------------
        # Products are currently global because the products table
        # does not have a company_id column.
        total_products_query = text("""
            SELECT COUNT(*)
            FROM products
            WHERE is_active = TRUE
        """)

        total_products = db.execute(
            total_products_query
        ).scalar() or 0

        # ---------------------------------------------------------
        # TOTAL INVENTORY
        # ---------------------------------------------------------
        # Inventory is currently global because the inventory
        # structure does not have a company_id column.
        total_inventory_query = text("""
            SELECT
                COALESCE(
                    SUM(quantity_on_hand - quantity_reserved),
                    0
                )
            FROM inventory
        """)

        total_inventory = db.execute(
            total_inventory_query
        ).scalar() or 0

        # ---------------------------------------------------------
        # LOW STOCK COUNT
        # ---------------------------------------------------------
        low_stock_count_query = text("""
            SELECT COUNT(*)
            FROM inventory
            WHERE
                (quantity_on_hand - quantity_reserved)
                <= reorder_level
        """)

        low_stock_count = db.execute(
            low_stock_count_query
        ).scalar() or 0

        # ---------------------------------------------------------
        # RECENT SALES ORDERS
        # ---------------------------------------------------------
        recent_orders_query = text("""
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
                COALESCE(
                    c.name,
                    'Unknown Customer'
                ) AS customer_name
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
            LIMIT 10
        """)

        recent_orders = db.execute(
            recent_orders_query,
            {
                "company_id": company_id,
            },
        ).mappings().all()

        # ---------------------------------------------------------
        # TOP PRODUCTS
        # ---------------------------------------------------------
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
                    SUM(soi.quantity * soi.unit_price),
                    0
                ) AS sales_amount

            FROM sales_order_items soi

            JOIN sales_orders so
                ON so.id = soi.sales_order_id

            LEFT JOIN products p
                ON p.id = soi.product_id

            WHERE so.company_id = :company_id
              AND COALESCE(UPPER(so.status), '') NOT IN (
                  'CANCELLED',
                  'REJECTED'
              )

            GROUP BY
                p.id,
                p.sku,
                p.name

            ORDER BY quantity_sold DESC
            LIMIT 10
        """)

        top_products = db.execute(
            top_products_query,
            {
                "company_id": company_id,
            },
        ).mappings().all()

        # ---------------------------------------------------------
        # LOW STOCK ITEMS
        # ---------------------------------------------------------
        low_stock_items_query = text("""
            SELECT
                i.id AS inventory_id,
                p.sku,
                p.name AS product_name,
                w.name AS warehouse_name,

                (
                    i.quantity_on_hand -
                    i.quantity_reserved
                ) AS quantity_available,

                COALESCE(
                    i.reorder_level,
                    0
                ) AS reorder_level

            FROM inventory i

            JOIN products p
                ON p.id = i.product_id

            JOIN warehouses w
                ON w.id = i.warehouse_id

            WHERE
                (
                    i.quantity_on_hand -
                    i.quantity_reserved
                ) <= COALESCE(
                    i.reorder_level,
                    0
                )

            ORDER BY
                quantity_available ASC,
                p.name,
                w.name

            LIMIT 20
        """)

        low_stock_items = db.execute(
            low_stock_items_query
        ).mappings().all()

        # ---------------------------------------------------------
        # RESPONSE
        # ---------------------------------------------------------

        return {
            "total_sales": float(total_sales),
            "total_orders": int(total_orders),
            "total_products": int(total_products),
            "total_inventory": float(total_inventory),
            "low_stock_count": int(low_stock_count),

            "recent_orders": [
                {
                    **dict(order),
                    "total_amount": float(
                        order["total_amount"] or 0
                    ),
                }
                for order in recent_orders
            ],

            "top_products": [
                {
                    **dict(product),
                    "quantity_sold": float(
                        product["quantity_sold"] or 0
                    ),
                    "sales_amount": float(
                        product["sales_amount"] or 0
                    ),
                }
                for product in top_products
            ],

            "low_stock_items": [
                {
                    **dict(item),
                    "quantity_available": float(
                        item["quantity_available"] or 0
                    ),
                    "reorder_level": float(
                        item["reorder_level"] or 0
                    ),
                }
                for item in low_stock_items
            ],
        }

    except HTTPException:
        raise

    except Exception as e:
        print("Error generating reports summary:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to generate reports summary",
        )
