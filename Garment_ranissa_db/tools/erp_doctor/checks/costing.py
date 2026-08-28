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
# MISSING COST SHEET
# ------------------------------------------------------------

def check_missing_cost_sheet(conn):

    execute_check(

        conn,

        "Checking products without cost sheet...",

        """
        SELECT
            style_id,
            style_code
        FROM style_master
        WHERE style_id NOT IN
        (
            SELECT DISTINCT style_id
            FROM cost_sheet
        );
        """

    )


# ------------------------------------------------------------
# ZERO MATERIAL COST
# ------------------------------------------------------------

def check_material_cost(conn):

    execute_check(

        conn,

        "Checking zero material cost...",

        """
        SELECT
            cost_sheet_id,
            style_id
        FROM cost_sheet
        WHERE material_cost <= 0;
        """

    )


# ------------------------------------------------------------
# ZERO LABOUR COST
# ------------------------------------------------------------

def check_labour_cost(conn):

    execute_check(

        conn,

        "Checking zero labour cost...",

        """
        SELECT
            cost_sheet_id,
            style_id
        FROM cost_sheet
        WHERE labour_cost <= 0;
        """

    )


# ------------------------------------------------------------
# ZERO OVERHEAD
# ------------------------------------------------------------

def check_overhead(conn):

    execute_check(

        conn,

        "Checking zero overhead...",

        """
        SELECT
            cost_sheet_id,
            style_id
        FROM cost_sheet
        WHERE overhead_cost <= 0;
        """

    )


# ------------------------------------------------------------
# NEGATIVE TOTAL COST
# ------------------------------------------------------------

def check_total_cost(conn):

    execute_check(

        conn,

        "Checking invalid total cost...",

        """
        SELECT
            cost_sheet_id,
            total_cost
        FROM cost_sheet
        WHERE total_cost <= 0;
        """

    )


# ------------------------------------------------------------
# SELLING PRICE BELOW COST
# ------------------------------------------------------------

def check_selling_price(conn):

    execute_check(

        conn,

        "Checking selling price below cost...",

        """
        SELECT
            style_id,
            selling_price,
            total_cost
        FROM cost_sheet
        WHERE selling_price < total_cost;
        """

    )


# ------------------------------------------------------------
# COST VARIANCE
# ------------------------------------------------------------

def check_variance(conn):

    execute_check(

        conn,

        "Checking excessive cost variance...",

        """
        SELECT
            production_order_id,
            standard_cost,
            actual_cost
        FROM production_cost
        WHERE ABS(actual_cost-standard_cost) >
              (standard_cost*0.20);
        """

    )


# ------------------------------------------------------------
# DUPLICATE COST SHEET
# ------------------------------------------------------------

def check_duplicate_cost_sheet(conn):

    execute_check(

        conn,

        "Checking duplicate cost sheets...",

        """
        SELECT
            style_id,
            version_no,
            COUNT(*)
        FROM cost_sheet
        GROUP BY style_id,version_no
        HAVING COUNT(*)>1;
        """

    )


# ------------------------------------------------------------
# EXPIRED COST SHEET
# ------------------------------------------------------------

def check_expired_cost(conn):

    execute_check(

        conn,

        "Checking expired cost sheets...",

        """
        SELECT
            cost_sheet_id,
            valid_to
        FROM cost_sheet
        WHERE valid_to < CURRENT_DATE;
        """

    )


# ------------------------------------------------------------
# FUTURE EFFECTIVE DATE
# ------------------------------------------------------------

def check_future_cost(conn):

    execute_check(

        conn,

        "Checking future effective cost sheets...",

        """
        SELECT
            cost_sheet_id,
            valid_from
        FROM cost_sheet
        WHERE valid_from > CURRENT_DATE;
        """

    )


# ------------------------------------------------------------
# RUN
# ------------------------------------------------------------

def run():

    #info("=" * 60)
    #info("COSTING CHECK")
    #info("=" * 60)
    start_section("COSTING CHECK")

    conn = get_connection()

    try:

        required_tables = [

            "cost_sheet",
            "production_cost",
            "style_master"

        ]

        missing = []

        for table in required_tables:

            if not table_exists(conn, table):
                missing.append(table)

        if missing:

            warn("Costing module is not installed.")

            for table in missing:
                warn(f"Missing table: {table}")

            return

        check_missing_cost_sheet(conn)

        check_material_cost(conn)

        check_labour_cost(conn)

        check_overhead(conn)

        check_total_cost(conn)

        check_selling_price(conn)

        check_variance(conn)

        check_duplicate_cost_sheet(conn)

        check_expired_cost(conn)

        check_future_cost(conn)

        #ok("Costing check completed.")
        end_section("costing check completed")

    finally:

        conn.close()
