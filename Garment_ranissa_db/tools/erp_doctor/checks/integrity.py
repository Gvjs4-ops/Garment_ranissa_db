from tools.common.database import get_connection
from tools.common.checker import (
    execute_check,
    require_tables,
    start_section,
    end_section,
)
from tools.common.printer import ok, warn, fail, info

# ------------------------------------------------------------
# HELPER
# ------------------------------------------------------------

def run_query(conn, title, query):

    info(title)

    with conn.cursor() as cur:

        cur.execute(query)

        count = cur.fetchone()[0]

    if count == 0:
        ok("No issues found.")
    else:
        fail(f"{count} issue(s) found.")


# ------------------------------------------------------------
# NEGATIVE INVENTORY
# ------------------------------------------------------------

def check_negative_inventory(conn):

    run_query(

        conn,

        "Checking negative inventory...",

        """
        SELECT COUNT(*)

        FROM inventory_balance

        WHERE quantity_on_hand < 0;
        """

    )


# ------------------------------------------------------------
# NEGATIVE AVAILABLE STOCK
# ------------------------------------------------------------

def check_negative_available_stock(conn):

    run_query(

        conn,

        "Checking negative available stock...",

        """
        SELECT COUNT(*)

        FROM inventory_balance

        WHERE quantity_available < 0;
        """

    )


# ------------------------------------------------------------
# DUPLICATE ITEM CODES
# ------------------------------------------------------------

def check_duplicate_item_codes(conn):

    run_query(

        conn,

        "Checking duplicate item codes...",

        """
        SELECT COUNT(*)

        FROM (

            SELECT item_code

            FROM item_master

            GROUP BY item_code

            HAVING COUNT(*) > 1

        ) x;
        """

    )


# ------------------------------------------------------------
# DUPLICATE STYLE CODES
# ------------------------------------------------------------

def check_duplicate_style_codes(conn):

    run_query(

        conn,

        "Checking duplicate style codes...",

        """
        SELECT COUNT(*)

        FROM (

            SELECT style_code

            FROM style_master

            GROUP BY style_code

            HAVING COUNT(*) > 1

        ) x;
        """

    )


# ------------------------------------------------------------
# DUPLICATE DOCUMENT NUMBERS
# ------------------------------------------------------------

def check_duplicate_purchase_orders(conn):

    run_query(

        conn,

        "Checking duplicate Purchase Order numbers...",

        """
        SELECT COUNT(*)

        FROM (

            SELECT po_number

            FROM purchase_order

            GROUP BY po_number

            HAVING COUNT(*)>1

        ) x;
        """

    )


# ------------------------------------------------------------
# PRODUCTION WITHOUT BOM
# ------------------------------------------------------------

def check_production_without_bom(conn):

    run_query(

        conn,

        "Checking production orders without BOM...",

        """
        SELECT COUNT(*)

        FROM production_order

        WHERE bom_id IS NULL;
        """

    )


# ------------------------------------------------------------
# COST SHEETS WITHOUT BOM
# ------------------------------------------------------------

def check_cost_sheet_without_bom(conn):

    run_query(

        conn,

        "Checking cost sheets without BOM...",

        """
        SELECT COUNT(*)

        FROM cost_sheet cs

        LEFT JOIN style_version sv

            ON sv.id = cs.style_version_id

        LEFT JOIN bill_of_material bom

            ON bom.style_version_id = sv.id

        WHERE bom.id IS NULL;
        """

    )


# ------------------------------------------------------------
# JOURNAL BALANCE
# ------------------------------------------------------------

def check_unbalanced_journals(conn):

    run_query(

        conn,

        "Checking unbalanced journals...",

        """
        SELECT COUNT(*)

        FROM (

            SELECT

                journal_entry_id,

                SUM(debit) debit,

                SUM(credit) credit

            FROM journal_entry_line

            GROUP BY journal_entry_id

            HAVING SUM(debit) <> SUM(credit)

        ) x;
        """

    )


# ------------------------------------------------------------
# ORPHAN INVENTORY TRANSACTIONS
# ------------------------------------------------------------

def check_orphan_inventory_transactions(conn):

    run_query(

        conn,

        "Checking orphan inventory transactions...",

        """
        SELECT COUNT(*)

        FROM inventory_transaction it

        LEFT JOIN item_master im

            ON im.id = it.item_id

        WHERE im.id IS NULL;
        """

    )


# ------------------------------------------------------------
# INACTIVE ITEMS USED
# ------------------------------------------------------------

def check_inactive_items(conn):

    run_query(

        conn,

        "Checking inactive items in transactions...",

        """
        SELECT COUNT(*)

        FROM inventory_transaction it

        JOIN item_master im

            ON im.id = it.item_id

        WHERE im.is_active = FALSE;
        """

    )


# ------------------------------------------------------------
# SALES ORDER CUSTOMER
# ------------------------------------------------------------

def check_sales_customer(conn):

    run_query(

        conn,

        "Checking Sales Orders without customers...",

        """
        SELECT COUNT(*)

        FROM sales_order

        WHERE customer_id IS NULL;
        """

    )


# ------------------------------------------------------------
# PURCHASE SUPPLIER
# ------------------------------------------------------------

def check_purchase_supplier(conn):

    run_query(

        conn,

        "Checking Purchase Orders without suppliers...",

        """
        SELECT COUNT(*)

        FROM purchase_order

        WHERE supplier_id IS NULL;
        """

    )

# ------------------------------------------------------------
# RUN
# ------------------------------------------------------------

def run():

    #info("=" * 60)
    #info("ERP DATA INTEGRITY CHECK")
    #info("=" * 60)
    start_section("INTEGRITY CHECK")

    conn = get_connection()

    try:
        if not require_tables(
            conn,
            "Integrity",
            [
                "inventory_balance",
                "inventory_transaction",
            ],
        ):
            return

        check_negative_inventory(conn)

        check_negative_available_stock(conn)

        check_duplicate_item_codes(conn)

        check_duplicate_style_codes(conn)

        check_duplicate_purchase_orders(conn)

        check_production_without_bom(conn)

        check_cost_sheet_without_bom(conn)

        check_unbalanced_journals(conn)

        check_orphan_inventory_transactions(conn)

        check_inactive_items(conn)

        check_sales_customer(conn)

        check_purchase_supplier(conn)

        #ok("Integrity check completed.")
        end_section("Integrity check completed")

    finally:

        conn.close()
