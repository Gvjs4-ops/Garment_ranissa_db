from tools.common.database import get_connection
from tools.common.checker import (
    execute_check,
    require_tables,
    start_section,
    end_section,
)
from tools.common.printer import ok, warn, fail, info
from tools.common.database import table_exists

# ------------------------------------------------------------
# PRODUCTION ORDER WITHOUT BOM
# ------------------------------------------------------------

def check_missing_bom(conn):

    execute_check(

        conn,

        "Checking production orders without BOM...",

        """
        SELECT
            production_order_id,
            production_order_no
        FROM production_order
        WHERE bom_id IS NULL;
        """

    )


# ------------------------------------------------------------
# PRODUCTION ORDER WITHOUT OPERATIONS
# ------------------------------------------------------------

def check_missing_operations(conn):

    execute_check(

        conn,

        "Checking production orders without operations...",

        """
        SELECT
            p.production_order_id,
            p.production_order_no
        FROM production_order p
        LEFT JOIN production_operation o
            ON o.production_order_id = p.production_order_id
        WHERE o.production_order_id IS NULL;
        """

    )


# ------------------------------------------------------------
# PRODUCTION ORDER WITHOUT MATERIALS
# ------------------------------------------------------------

def check_missing_materials(conn):

    execute_check(

        conn,

        "Checking production orders without materials...",

        """
        SELECT
            p.production_order_id,
            p.production_order_no
        FROM production_order p
        LEFT JOIN production_material m
            ON m.production_order_id = p.production_order_id
        WHERE m.production_order_id IS NULL;
        """

    )


# ------------------------------------------------------------
# INVALID OPERATION SEQUENCE
# ------------------------------------------------------------

def check_operation_sequence(conn):

    execute_check(

        conn,

        "Checking invalid operation sequence...",

        """
        SELECT
            production_order_id,
            operation_no,
            sequence_no
        FROM production_operation
        WHERE sequence_no <= 0;
        """

    )


# ------------------------------------------------------------
# CLOSED ORDER WITH OPEN OPERATIONS
# ------------------------------------------------------------

def check_closed_orders(conn):

    execute_check(

        conn,

        "Checking closed production orders...",

        """
        SELECT
            p.production_order_no
        FROM production_order p
        JOIN production_operation o
            ON o.production_order_id = p.production_order_id
        WHERE p.status='CLOSED'
          AND o.status<>'COMPLETED';
        """

    )


# ------------------------------------------------------------
# OVER ISSUED MATERIAL
# ------------------------------------------------------------

def check_material_issue(conn):

    execute_check(

        conn,

        "Checking over issued materials...",

        """
        SELECT
            production_order_id,
            item_id,
            planned_quantity,
            issued_quantity
        FROM production_material
        WHERE issued_quantity > planned_quantity;
        """

    )


# ------------------------------------------------------------
# OVER RECEIPT
# ------------------------------------------------------------

def check_finished_goods(conn):

    execute_check(

        conn,

        "Checking finished goods receipt...",

        """
        SELECT
            production_order_no,
            planned_quantity,
            completed_quantity
        FROM production_order
        WHERE completed_quantity > planned_quantity;
        """

    )


# ------------------------------------------------------------
# DUPLICATE DOCUMENT NUMBER
# ------------------------------------------------------------

def check_duplicate_orders(conn):

    execute_check(

        conn,

        "Checking duplicate production order numbers...",

        """
        SELECT
            production_order_no,
            COUNT(*)
        FROM production_order
        GROUP BY production_order_no
        HAVING COUNT(*) > 1;
        """

    )


# ------------------------------------------------------------
# FUTURE DATE
# ------------------------------------------------------------

def check_future_orders(conn):

    execute_check(

        conn,

        "Checking future dated production orders...",

        """
        SELECT
            production_order_no,
            production_date
        FROM production_order
        WHERE production_date > NOW();
        """

    )


# ------------------------------------------------------------
# RUN
# ------------------------------------------------------------

def run():

    #info("=" * 60)
    #info("PRODUCTION CHECK")
    #info("=" * 60)
    start_section("PRCODUCTION CHECK")

    conn = get_connection()

    try:

        required_tables = [

            "production_order",
            "production_operation",
            "production_material",
            "bill_of_material",

        ]

        missing = []

        for table in required_tables:

            if not table_exists(conn, table):
                missing.append(table)

        if missing:

            warn("Production module is not installed.")

            for table in missing:
                warn(f"Missing table: {table}")

            return

        check_missing_bom(conn)

        check_missing_operations(conn)

        check_missing_materials(conn)

        check_operation_sequence(conn)

        check_closed_orders(conn)

        check_material_issue(conn)

        check_finished_goods(conn)

        check_duplicate_orders(conn)

        check_future_orders(conn)

        #ok("Production check completed.")
        end_section("Production check completed")

    finally:

        conn.close()
