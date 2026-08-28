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

def query_count(conn, title, sql):

    info(title)

    with conn.cursor() as cur:
        cur.execute(sql)
        count = cur.fetchone()[0]

    if count == 0:
        ok("Passed")
    else:
        fail(f"{count} issue(s) found.")


# ------------------------------------------------------------
# TABLES WITHOUT RLS
# ------------------------------------------------------------

def check_rls_disabled(conn):

    query_count(

        conn,

        "Checking tables with RLS disabled...",

        """
        SELECT COUNT(*)
        FROM pg_tables t
        JOIN pg_class c
          ON c.relname=t.tablename
        WHERE schemaname='public'
          AND c.relrowsecurity = FALSE;
        """

    )


# ------------------------------------------------------------
# TABLES WITHOUT POLICIES
# ------------------------------------------------------------

def check_missing_policies(conn):

    query_count(

        conn,

        "Checking tables without RLS policies...",

        """
        SELECT COUNT(*)
        FROM pg_tables t
        WHERE schemaname='public'
          AND NOT EXISTS (

              SELECT 1
              FROM pg_policies p
              WHERE p.tablename=t.tablename

          );
        """

    )


# ------------------------------------------------------------
# PUBLIC PRIVILEGES
# ------------------------------------------------------------

def check_public_grants(conn):

    query_count(

        conn,

        "Checking PUBLIC grants...",

        """
        SELECT COUNT(*)

        FROM information_schema.role_table_grants

        WHERE grantee='PUBLIC';

        """

    )


# ------------------------------------------------------------
# SECURITY DEFINER FUNCTIONS
# ------------------------------------------------------------

def check_security_definer(conn):

    info("Checking SECURITY DEFINER functions...")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT

            proname

        FROM pg_proc

        WHERE prosecdef = TRUE

        ORDER BY proname;

        """)

        rows = cur.fetchall()

    if not rows:
        ok("No SECURITY DEFINER functions.")
        return

    for fn in rows:
        warn(fn[0])


# ------------------------------------------------------------
# TABLE OWNERS
# ------------------------------------------------------------

def check_table_owners(conn):

    info("Checking table ownership...")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT

            tablename,
            tableowner

        FROM pg_tables

        WHERE schemaname='public'

        ORDER BY tablename;

        """)

        rows = cur.fetchall()

    owners = {}

    for table, owner in rows:

        owners.setdefault(owner, []).append(table)

    for owner in owners:

        info(f"{owner}: {len(owners[owner])} tables")


# ------------------------------------------------------------
# TENANT ISOLATION
# ------------------------------------------------------------

def check_tenant_columns(conn):

    info("Checking tenant isolation...")

    ignore = {

        "lookup_type",
        "lookup_value"

    }

    with conn.cursor() as cur:

        cur.execute("""

        SELECT table_name

        FROM information_schema.tables

        WHERE table_schema='public';

        """)

        tables = [r[0] for r in cur.fetchall()]

    for table in tables:

        if table in ignore:
            continue

        with conn.cursor() as cur:

            cur.execute("""

            SELECT column_name

            FROM information_schema.columns

            WHERE table_name=%s;

            """, (table,))

            cols = {r[0] for r in cur.fetchall()}

        if "tenant_id" not in cols:

            warn(f"{table}: tenant_id missing")

        if "company_id" not in cols:

            warn(f"{table}: company_id missing")


# ------------------------------------------------------------
# DANGEROUS POLICIES
# ------------------------------------------------------------

def check_open_policies(conn):

    info("Checking overly permissive policies...")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT

            tablename,
            policyname,
            qual

        FROM pg_policies;

        """)

        rows = cur.fetchall()

    found = False

    for table, policy, qual in rows:

        if qual is None:
            continue

        text = str(qual).lower()

        if "true" in text:

            warn(f"{table}: {policy}")

            found = True

    if not found:
        ok("No overly permissive policies.")


# ------------------------------------------------------------
# ROLE MEMBERS
# ------------------------------------------------------------

def check_roles(conn):

    info("Checking database roles...")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT rolname

        FROM pg_roles

        ORDER BY rolname;

        """)

        roles = cur.fetchall()

    ok(f"{len(roles)} roles found.")


# ------------------------------------------------------------
# EXTENSIONS
# ------------------------------------------------------------

def check_extensions(conn):

    info("Security related extensions...")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT extname

        FROM pg_extension

        ORDER BY extname;

        """)

        exts = [r[0] for r in cur.fetchall()]

    if "pgcrypto" in exts:
        ok("pgcrypto installed")
    else:
        fail("pgcrypto missing")


# ------------------------------------------------------------
# RUN
# ------------------------------------------------------------

def run():

    #info("=" * 60)
    #info("SECURITY CHECK")
    #info("=" * 60)
    start_section("SECURITY CHECK")

    conn = get_connection()

    try:

        check_rls_disabled(conn)

        check_missing_policies(conn)

        check_public_grants(conn)

        check_security_definer(conn)

        check_table_owners(conn)

        check_tenant_columns(conn)

        check_open_policies(conn)

        check_roles(conn)

        check_extensions(conn)

        #ok("Security check completed.")
        end_section("security check completed")

    finally:

        conn.close()
