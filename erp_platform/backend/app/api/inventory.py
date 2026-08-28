from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
)
class StockReceipt(BaseModel):
    product_id: str
    warehouse_id: str
    quantity: float
    reorder_level: float = 0
    notes: str | None = None

class InventoryUpdate(BaseModel):
    quantity_on_hand: float
    reorder_level: float | None = None
    notes: str | None = None

@router.get("")
def get_inventory(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            i.id,
            i.product_id,
            p.sku,
            p.style_code,
            p.name AS product_name,
            p.color,
            p.size,
            p.unit,

            i.warehouse_id,
            w.name AS warehouse_name,

            i.quantity_on_hand,
            i.quantity_reserved,
            (i.quantity_on_hand - i.quantity_reserved) AS quantity_available,
            i.reorder_level,

            CASE
                WHEN (i.quantity_on_hand - i.quantity_reserved) <= 0
                    THEN 'OUT_OF_STOCK'
                WHEN (i.quantity_on_hand - i.quantity_reserved) <= i.reorder_level
                    THEN 'LOW_STOCK'
                ELSE 'IN_STOCK'
            END AS stock_status

        FROM inventory i

        JOIN products p
            ON p.id = i.product_id

        JOIN warehouses w
            ON w.id = i.warehouse_id

        ORDER BY
            p.name,
            w.name
    """)

    result = db.execute(query).mappings().all()

    return [dict(row) for row in result]

@router.post("/receive")
def receive_stock(
    receipt: StockReceipt,
    db: Session = Depends(get_db),
):
    if receipt.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than zero.",
        )

    try:
        inventory_query = text("""
            INSERT INTO inventory (
                product_id,
                warehouse_id,
                quantity_on_hand,
                quantity_reserved,
                reorder_level
            )
            VALUES (
                :product_id,
                :warehouse_id,
                :quantity,
                0,
                :reorder_level
            )
            ON CONFLICT (product_id, warehouse_id)
            DO UPDATE SET
                quantity_on_hand =
                    inventory.quantity_on_hand + EXCLUDED.quantity_on_hand,
                reorder_level = EXCLUDED.reorder_level,
                updated_at = NOW()
            RETURNING
                id,
                product_id,
                warehouse_id,
                quantity_on_hand,
                quantity_reserved,
                reorder_level
        """)

        inventory_result = db.execute(
            inventory_query,
            {
                "product_id": receipt.product_id,
                "warehouse_id": receipt.warehouse_id,
                "quantity": receipt.quantity,
                "reorder_level": receipt.reorder_level,
            },
        ).mappings().one()

        transaction_query = text("""
            INSERT INTO inventory_transactions (
                product_id,
                warehouse_id,
                transaction_type,
                quantity,
                notes
            )
            VALUES (
                :product_id,
                :warehouse_id,
                'RECEIPT',
                :quantity,
                :notes
            )
            RETURNING id
        """)

        db.execute(
            transaction_query,
            {
                "product_id": receipt.product_id,
                "warehouse_id": receipt.warehouse_id,
                "quantity": receipt.quantity,
                "notes": receipt.notes,
            },
        )

        db.commit()

        return dict(inventory_result)

    except Exception:
        db.rollback()
        raise

@router.get("/warehouses")
def get_warehouses(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            id,
            name,
            location,
            is_active
        FROM warehouses
        WHERE is_active = true
        ORDER BY name
    """)

    result = db.execute(query).mappings().all()

    return [dict(row) for row in result]

@router.put("/{inventory_id}")
def update_inventory_stock(
    inventory_id: str,
    update: InventoryUpdate,
    db: Session = Depends(get_db),
):
    if update.quantity_on_hand < 0:
        raise HTTPException(
            status_code=400,
            detail="Stock quantity cannot be negative.",
        )

    try:
        current_query = text("""
            SELECT
                id,
                product_id,
                warehouse_id,
                quantity_on_hand,
                reorder_level
            FROM inventory
            WHERE id = :inventory_id
        """)

        current = db.execute(
            current_query,
            {"inventory_id": inventory_id},
        ).mappings().first()

        if not current:
            raise HTTPException(
                status_code=404,
                detail="Inventory record not found.",
            )

        old_quantity = float(current["quantity_on_hand"])
        new_quantity = float(update.quantity_on_hand)

        difference = new_quantity - old_quantity

        update_query = text("""
            UPDATE inventory
            SET
                quantity_on_hand = :quantity_on_hand,
                reorder_level = COALESCE(
                    :reorder_level,
                    reorder_level
                ),
                updated_at = NOW()
            WHERE id = :inventory_id
            RETURNING
                id,
                product_id,
                warehouse_id,
                quantity_on_hand,
                quantity_reserved,
                reorder_level
        """)

        updated = db.execute(
            update_query,
            {
                "inventory_id": inventory_id,
                "quantity_on_hand": new_quantity,
                "reorder_level": update.reorder_level,
            },
        ).mappings().one()

        if difference != 0:
            transaction_type = (
                "ADJUSTMENT_IN"
                if difference > 0
                else "ADJUSTMENT_OUT"
            )

            transaction_query = text("""
                INSERT INTO inventory_transactions (
                    product_id,
                    warehouse_id,
                    transaction_type,
                    quantity,
                    notes
                )
                VALUES (
                    :product_id,
                    :warehouse_id,
                    :transaction_type,
                    :quantity,
                    :notes
                )
            """)

            db.execute(
                transaction_query,
                {
                    "product_id": current["product_id"],
                    "warehouse_id": current["warehouse_id"],
                    "transaction_type": transaction_type,
                    "quantity": abs(difference),
                    "notes": update.notes or "Manual stock edit",
                },
            )

        db.commit()

        return dict(updated)

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise
