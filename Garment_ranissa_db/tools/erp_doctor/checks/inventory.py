from tools.common.database import get_connection
from tools.common.checker import (
    execute_check,
    require_tables,
    start_section,
    end_section,
)
from tools.common.database import table_exists
from tools.common.printer import ok, warn, fail, info


# ------------------------------------------------------------
# NEGATIVE STOCK
# ------------------------------------------------------------

def check_negative_stock(conn):

    execute_check(

        conn,

        "Checking negative inventory...",

        """
        SELECT
            warehouse_id,
            item_id,
            quantity_on_hand
        FROM inventory_balance
        WHERE quantity_on_hand < 0;
        """

    )


# ------------------------------------------------------------
# RESERVED > ON HAND
# ------------------------------------------------------------

def check_reserved_stock(conn):

    execute_check(

        conn,

        "Checking reserved quantity...",

        """
        SELECT
            warehouse_id,
            item_id,
            quantity_on_hand,
            quantity_reserved
        FROM inventory_balance
        WHERE quantity_reserved > quantity_on_hand;
        """

    )


# ------------------------------------------------------------
# AVAILABLE STOCK
# ------------------------------------------------------------

def check_available_stock(conn):

    execute_check(

        conn,

        "Checking available quantity...",

        """
        SELECT
            warehouse_id,
            item_id,
            quantity_available,
            quantity_on_hand
        FROM inventory_balance
        WHERE quantity_available > quantity_on_hand;
        """

    )


# ------------------------------------------------------------
# DUPLICATE BALANCES
# ------------------------------------------------------------

def check_duplicate_balance(conn):

    execute_check(

        conn,

        "Checking duplicate inventory balance...",

        """
        SELECT

            warehouse_id,
            item_id,
            COUNT(*)

        FROM inventory_balance

        GROUP BY warehouse_id,item_id

        HAVING COUNT(*) > 1;
        """

    )


# ------------------------------------------------------------
# ORPHAN INVENTORY TRANSACTIONS
# ------------------------------------------------------------

def check_orphan_transactions(conn):

    execute_check(

        conn,

        "Checking orphan inventory transactions...",

        """
        SELECT

            transaction_id

        FROM inventory_transaction t

        LEFT JOIN item_master i

          ON i.item_id=t.item_id

        WHERE i.item_id IS NULL;
        """

    )


# ------------------------------------------------------------
# INVALID WAREHOUSE
# ------------------------------------------------------------

def check_invalid_warehouse(conn):

    execute_check(

        conn,

        "Checking warehouse references...",

        """
        SELECT

            transaction_id

        FROM inventory_transaction t

        LEFT JOIN warehouse w

          ON w.warehouse_id=t.warehouse_id

        WHERE w.warehouse_id IS NULL;
        """

    )


# ------------------------------------------------------------
# ZERO COST ITEMS
# ------------------------------------------------------------

def check_zero_cost(conn):

    execute_check(

        conn,

        "Checking zero-cost inventory...",

        """
        SELECT

            item_id

        FROM inventory_balance

        WHERE average_cost <= 0;
        """

    )


# ------------------------------------------------------------
# MISSING UOM
# ------------------------------------------------------------

def check_missing_uom(conn):

    execute_check(

        conn,

        "Checking missing UOM...",

        """
        SELECT

            item_id,
            item_code

        FROM item_master

        WHERE inventory_uom_id IS NULL;
        """

    )


# ------------------------------------------------------------
# REORDER LEVEL
# ------------------------------------------------------------

def check_reorder(conn):

    execute_check(

        conn,

        "Checking reorder levels...",

        """
        SELECT

            warehouse_id,
            item_id,
            quantity_available,
            reorder_level

        FROM inventory_balance

        WHERE quantity_available < reorder_level;
        """

    )


# ------------------------------------------------------------
# FUTURE TRANSACTIONS
# ------------------------------------------------------------

def check_future_transactions(conn):

    execute_check(

        conn,

        "Checking future dated inventory transactions...",

        """
        SELECT

            transaction_id,
            transaction_date

        FROM inventory_transaction

        WHERE transaction_date > NOW();
        """

    )


# ------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------

def run():

    #info("=" * 60)
    #info("INVENTORY CHECK")
    #info("=" * 60)
    start_section("INVENTORY CHECK")

    conn = get_connection()

    required_tables = [
    "inventory_balance",
    "inventory_transaction",
    "item_master",
    "warehouse",
    ]

    missing = []

    for table in required_tables:

        if not table_exists(conn, table):
            missing.append(table)

    if missing:

        warn("Inventory module is not installed.")

        for table in missing:
            warn(f"Missing table: {table}")

        conn.close()
        return
    try:

        check_negative_stock(conn)

        check_reserved_stock(conn)

        check_available_stock(conn)

        check_duplicate_balance(conn)

        check_orphan_transactions(conn)

        check_invalid_warehouse(conn)

        check_zero_cost(conn)

        check_missing_uom(conn)

        check_reorder(conn)

        check_future_transactions(conn)

        #ok("Inventory check completed.")
        end_section("Inventory check")

    finally:

        conn.close()
