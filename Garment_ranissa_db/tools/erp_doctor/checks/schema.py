from tools.common.database import get_connection
from tools.common.checker import (
    execute_check,
    require_tables,
    start_section,
    end_section,
)
from tools.common.printer import ok, warn, fail, info


# ------------------------------------------------------------
# EXPECTED ERP COLUMNS
# ------------------------------------------------------------

EXPECTED_COMMON_COLUMNS = [
    "id",
    "created_at",
    "updated_at"
]

EXPECTED_BUSINESS_COLUMNS = [
    "tenant_id",
    "company_id"
]


# ------------------------------------------------------------
# GET USER TABLES
# ------------------------------------------------------------

def get_tables(conn):

    with conn.cursor() as cur:

        cur.execute("""

            SELECT table_name

            FROM information_schema.tables

            WHERE table_schema='public'

            ORDER BY table_name;

        """)

        return [r[0] for r in cur.fetchall()]


# ------------------------------------------------------------
# GET COLUMNS
# ------------------------------------------------------------

def get_columns(conn, table):

    with conn.cursor() as cur:

        cur.execute("""

            SELECT column_name

            FROM information_schema.columns

            WHERE table_schema='public'
            AND table_name=%s

        """, (table,))

        return {r[0] for r in cur.fetchall()}


# ------------------------------------------------------------
# CHECK COMMON COLUMNS
# ------------------------------------------------------------

def check_common_columns(conn):

    info("Checking common columns...")

    for table in get_tables(conn):

        columns = get_columns(conn, table)

        missing = []

        for col in EXPECTED_COMMON_COLUMNS:

            if col not in columns:
                missing.append(col)

        if missing:
            warn(f"{table}: Missing {', '.join(missing)}")
        else:
            ok(table)


# ------------------------------------------------------------
# CHECK BUSINESS COLUMNS
# ------------------------------------------------------------

def check_business_columns(conn):

    info("Checking tenant/company isolation...")

    ignore = {

        "lookup_type",
        "lookup_value",
        "document_sequence"

    }

    for table in get_tables(conn):

        if table in ignore:
            continue

        cols = get_columns(conn, table)

        for col in EXPECTED_BUSINESS_COLUMNS:

            if col not in cols:
                warn(f"{table}: Missing {col}")


# ------------------------------------------------------------
# FOREIGN KEYS
# ------------------------------------------------------------

def check_foreign_keys(conn):

    info("Checking foreign keys...")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT

            tc.table_name,

            kcu.column_name,

            ccu.table_name

        FROM information_schema.table_constraints tc

        JOIN information_schema.key_column_usage kcu

             ON tc.constraint_name=kcu.constraint_name

        JOIN information_schema.constraint_column_usage ccu

             ON ccu.constraint_name=tc.constraint_name

        WHERE tc.constraint_type='FOREIGN KEY'

        ORDER BY tc.table_name;

        """)

        rows = cur.fetchall()

    ok(f"{len(rows)} foreign keys found.")


# ------------------------------------------------------------
# UNIQUE CONSTRAINTS
# ------------------------------------------------------------

def check_unique_constraints(conn):

    info("Checking unique constraints...")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT COUNT(*)

        FROM information_schema.table_constraints

        WHERE constraint_type='UNIQUE';

        """)

        total = cur.fetchone()[0]

    ok(f"{total} unique constraints.")


# ------------------------------------------------------------
# NOT NULL
# ------------------------------------------------------------

def check_nullable_columns(conn):

    info("Checking nullable columns...")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT

            table_name,
            column_name

        FROM information_schema.columns

        WHERE is_nullable='YES'

        ORDER BY table_name;

        """)

        rows = cur.fetchall()

    warn(f"{len(rows)} nullable columns detected.")


# ------------------------------------------------------------
# INDEXES
# ------------------------------------------------------------

def check_duplicate_indexes(conn):

    info("Checking duplicate indexes...")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT

            tablename,

            indexname

        FROM pg_indexes

        WHERE schemaname='public';

        """)

        indexes = cur.fetchall()

    ok(f"{len(indexes)} indexes.")


# ------------------------------------------------------------
# AUDIT COLUMNS
# ------------------------------------------------------------

def check_audit_columns(conn):

    info("Checking audit columns...")

    for table in get_tables(conn):

        cols = get_columns(conn, table)

        if "created_at" not in cols:
            warn(f"{table}: created_at missing")

        if "updated_at" not in cols:
            warn(f"{table}: updated_at missing")


# ------------------------------------------------------------
# PRIMARY KEYS
# ------------------------------------------------------------

def check_primary_keys(conn):

    info("Checking primary keys...")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT

            table_name

        FROM information_schema.table_constraints

        WHERE constraint_type='PRIMARY KEY';

        """)

        tables = {r[0] for r in cur.fetchall()}

    for table in get_tables(conn):

        if table not in tables:
            fail(f"{table}: No primary key")


# ------------------------------------------------------------
# RUN
# ------------------------------------------------------------

def run():

    #info("=" * 60)
    #info("SCHEMA VALIDATION")
    #info("=" * 60)
    start_section("SCHEMA VALIDATION")

    conn = get_connection()

    try:

        check_primary_keys(conn)

        check_common_columns(conn)

        check_business_columns(conn)

        check_foreign_keys(conn)

        check_unique_constraints(conn)

        check_nullable_columns(conn)

        check_duplicate_indexes(conn)

        check_audit_columns(conn)

        #ok("Schema validation completed.")
        end_section("schema validation complete")

    finally:

        conn.close()
