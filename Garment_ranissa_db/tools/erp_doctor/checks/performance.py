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

def execute_count(conn, title, query):

    info(title)

    with conn.cursor() as cur:
        cur.execute(query)
        value = cur.fetchone()[0]

    return value


# ------------------------------------------------------------
# TABLE SIZE
# ------------------------------------------------------------

def check_table_sizes(conn):

    info("Largest tables")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT

            relname,

            pg_size_pretty(pg_total_relation_size(relid))

        FROM pg_catalog.pg_statio_user_tables

        ORDER BY pg_total_relation_size(relid) DESC;

        """)

        rows = cur.fetchall()

    for table, size in rows:
        info(f"{table:<35} {size}")


# ------------------------------------------------------------
# INDEX USAGE
# ------------------------------------------------------------

def check_unused_indexes(conn):

    info("Unused indexes")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT

            schemaname,
            relname,
            indexrelname,
            idx_scan

        FROM pg_stat_user_indexes

        WHERE idx_scan = 0

        ORDER BY relname;

        """)

        rows = cur.fetchall()

    if not rows:
        ok("No unused indexes.")
        return

    for schema, table, index, scans in rows:
        warn(f"{table}: {index} (idx_scan={scans})")


# ------------------------------------------------------------
# MISSING FOREIGN KEY INDEXES
# ------------------------------------------------------------

def check_missing_fk_indexes(conn):

    info("Foreign keys without indexes")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT

            tc.table_name,
            kcu.column_name

        FROM information_schema.table_constraints tc

        JOIN information_schema.key_column_usage kcu

             ON tc.constraint_name = kcu.constraint_name

        WHERE tc.constraint_type='FOREIGN KEY'

        EXCEPT

        SELECT

            t.relname,
            a.attname

        FROM pg_index i

        JOIN pg_class t
          ON t.oid=i.indrelid

        JOIN pg_attribute a
          ON a.attrelid=t.oid
         AND a.attnum=ANY(i.indkey);

        """)

        rows = cur.fetchall()

    if not rows:
        ok("All foreign keys are indexed.")
        return

    for table, column in rows:
        warn(f"{table}.{column}")


# ------------------------------------------------------------
# DEAD TUPLES
# ------------------------------------------------------------

def check_dead_tuples(conn):

    info("Dead tuples")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT

            relname,
            n_dead_tup

        FROM pg_stat_user_tables

        WHERE n_dead_tup > 100

        ORDER BY n_dead_tup DESC;

        """)

        rows = cur.fetchall()

    if not rows:
        ok("No excessive dead tuples.")
        return

    for table, dead in rows:
        warn(f"{table}: {dead}")


# ------------------------------------------------------------
# VACUUM
# ------------------------------------------------------------

def check_vacuum(conn):

    info("VACUUM status")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT

            relname,
            last_vacuum,
            last_autovacuum

        FROM pg_stat_user_tables

        ORDER BY relname;

        """)

        rows = cur.fetchall()

    for table, vacuum, auto in rows:

        if vacuum is None and auto is None:
            warn(f"{table}: Never vacuumed")
        else:
            ok(f"{table}")


# ------------------------------------------------------------
# ANALYZE
# ------------------------------------------------------------

def check_analyze(conn):

    info("ANALYZE status")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT

            relname,
            last_analyze,
            last_autoanalyze

        FROM pg_stat_user_tables

        ORDER BY relname;

        """)

        rows = cur.fetchall()

    for table, analyze, auto in rows:

        if analyze is None and auto is None:
            warn(f"{table}: Never analyzed")
        else:
            ok(f"{table}")


# ------------------------------------------------------------
# DATABASE SIZE
# ------------------------------------------------------------

def check_database_size(conn):

    info("Database size")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT

            pg_size_pretty(pg_database_size(current_database()));

        """)

        size = cur.fetchone()[0]

    ok(f"Database Size: {size}")


# ------------------------------------------------------------
# PG_STAT_STATEMENTS
# ------------------------------------------------------------

def check_pg_stat_statements(conn):

    info("pg_stat_statements")

    with conn.cursor() as cur:

        cur.execute("""

        SELECT EXISTS(

            SELECT 1

            FROM pg_extension

            WHERE extname='pg_stat_statements'

        );

        """)

        enabled = cur.fetchone()[0]

    if enabled:
        ok("pg_stat_statements enabled")
    else:
        warn("pg_stat_statements not installed")


# ------------------------------------------------------------
# LONG RUNNING QUERIES
# ------------------------------------------------------------

def check_long_queries(conn):

    info("Long running queries")

    try:

        with conn.cursor() as cur:

            cur.execute("""

            SELECT

                pid,
                now()-query_start,
                state,
                LEFT(query,100)

            FROM pg_stat_activity

            WHERE state <> 'idle'

            ORDER BY query_start;

            """)

            rows = cur.fetchall()

        if not rows:
            ok("No long running queries.")
            return

        for pid, runtime, state, query in rows:
            warn(f"PID {pid}  {runtime}")

    except Exception:
        warn("Insufficient permission to inspect pg_stat_activity.")


# ------------------------------------------------------------
# RUN
# ------------------------------------------------------------

def run():

    #info("=" * 60)
    #info("DATABASE PERFORMANCE CHECK")
    #info("=" * 60)
    start_section("database performance check")

    conn = get_connection()

    try:

        check_database_size(conn)

        check_table_sizes(conn)

        check_unused_indexes(conn)

        check_missing_fk_indexes(conn)

        check_dead_tuples(conn)

        check_vacuum(conn)

        check_analyze(conn)

        check_pg_stat_statements(conn)

        check_long_queries(conn)

        #ok("Performance check completed.")
        end_section("performance check completed")

    finally:

        conn.close()
