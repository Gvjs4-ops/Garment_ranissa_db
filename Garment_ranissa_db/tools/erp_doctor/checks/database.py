from tools.common.database import get_connection
from tools.common.checker import (
    execute_scalar,
    execute_check,
    start_section,
    end_section,
)
from tools.common.printer import ok, warn, fail, info

EXPECTED_TABLES = [
    "tenant",
    "company",
    "business_unit",
    "warehouse",
    "business_partner",
    "item_master",
    "style_master",
    "bill_of_material",
    "inventory_balance",
    "inventory_transaction",
    "purchase_order",
    "sales_order",
    "production_order",
    "cost_sheet",
    "journal_entry",
]


def database_connection(conn):
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT version();")
            version = cur.fetchone()[0]
            ok(f"Connected to PostgreSQL")
            info(version)
    except Exception as e:
        fail(f"Database connection failed: {e}")


def check_tables(conn):
    info("Checking required tables...")

    with conn.cursor() as cur:

        cur.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema='public'
        """)

        existing = {r[0] for r in cur.fetchall()}

    missing = []

    for table in EXPECTED_TABLES:
        if table in existing:
            ok(table)
        else:
            fail(f"{table} (missing)")
            missing.append(table)

    if not missing:
        ok("All required tables exist.")


def check_rls(conn):

    info("Checking Row Level Security...")

    with conn.cursor() as cur:

        cur.execute("""
            SELECT
                tablename,
                rowsecurity
            FROM pg_tables
            WHERE schemaname='public'
            ORDER BY tablename;
        """)

        rows = cur.fetchall()

    disabled = []

    for table, enabled in rows:

        if enabled:
            ok(f"{table}: RLS enabled")
        else:
            warn(f"{table}: RLS disabled")
            disabled.append(table)

    if not disabled:
        ok("RLS enabled on every table.")


def check_indexes(conn):

    info("Checking indexes...")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT
            tablename,
            indexname

        FROM pg_indexes

        WHERE schemaname='public'

        ORDER BY tablename;

        """)

        indexes = cur.fetchall()

    ok(f"{len(indexes)} indexes found.")


def check_triggers(conn):

    info("Checking triggers...")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT trigger_name

        FROM information_schema.triggers

        ORDER BY trigger_name;

        """)

        triggers = cur.fetchall()

    ok(f"{len(triggers)} triggers installed.")


def check_extensions(conn):

    info("Checking PostgreSQL extensions...")

    required = {
        "pgcrypto",
    }

    with conn.cursor() as cur:

        cur.execute("""

        SELECT extname

        FROM pg_extension

        """)

        installed = {r[0] for r in cur.fetchall()}

    for ext in required:

        if ext in installed:
            ok(ext)
        else:
            fail(f"{ext} not installed")


def run():

    #info("=" * 60)
    #info("DATABASE HEALTH CHECK")
    #info("=" * 60)
    start_section("DATABASE HEALTH CHECK")
    conn = get_connection()

    try:

        database_connection(conn)

        check_extensions(conn)

        check_tables(conn)

        check_indexes(conn)

        check_triggers(conn)

        check_rls(conn)

        #ok("Database health check completed.")
        end_section("Database health check")

    finally:

        conn.close()
