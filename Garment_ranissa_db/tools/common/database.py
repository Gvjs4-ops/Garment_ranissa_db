"""
============================================================
Ranissa Tooling SDK
Database Utilities
============================================================
"""

import os
from contextlib import contextmanager
import os
from pathlib import Path

from dotenv import load_dotenv
import psycopg

# Load .env from project root
PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")
print("database.py =", __file__)
print("PROJECT_ROOT =", PROJECT_ROOT)
print("ENV PATH =", PROJECT_ROOT / ".env")
print("ENV EXISTS =", (PROJECT_ROOT / ".env").exists())
# ============================================================
# CONNECTION
# ============================================================

def get_connection():

    return psycopg.connect(
        host=os.environ["DB_HOST"],
        port=os.environ.get("DB_PORT", "5432"),
        dbname=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
    )


def close_connection(conn):

    if conn:
        conn.close()


@contextmanager
def connection():

    conn = get_connection()

    try:

        yield conn

    finally:

        conn.close()


# ============================================================
# TRANSACTIONS
# ============================================================

def commit(conn):

    conn.commit()


def rollback(conn):

    conn.rollback()


# ============================================================
# EXECUTION
# ============================================================

def execute(conn, sql, params=None):

    with conn.cursor() as cur:

        cur.execute(sql, params)

        return cur


def execute_fetchone(conn, sql, params=None):

    with conn.cursor() as cur:

        cur.execute(sql, params)

        return cur.fetchone()


def execute_fetchall(conn, sql, params=None):

    with conn.cursor() as cur:

        cur.execute(sql, params)

        return cur.fetchall()


def execute_scalar(conn, sql, params=None):

    row = execute_fetchone(conn, sql, params)

    if row is None:

        return None

    return row[0]


# ============================================================
# EXISTS HELPERS
# ============================================================

def table_exists(conn, table_name):

    sql = """
    SELECT EXISTS (

        SELECT 1

        FROM information_schema.tables

        WHERE table_schema='public'
          AND table_name=%s

    )
    """

    return execute_scalar(conn, sql, (table_name,))


def view_exists(conn, view_name):

    sql = """
    SELECT EXISTS (

        SELECT 1

        FROM information_schema.views

        WHERE table_schema='public'
          AND table_name=%s

    )
    """

    return execute_scalar(conn, sql, (view_name,))


def function_exists(conn, function_name):

    sql = """
    SELECT EXISTS (

        SELECT 1

        FROM pg_proc

        WHERE proname=%s

    )
    """

    return execute_scalar(conn, sql, (function_name,))


def extension_exists(conn, extension_name):

    sql = """
    SELECT EXISTS (

        SELECT 1

        FROM pg_extension

        WHERE extname=%s

    )
    """

    return execute_scalar(conn, sql, (extension_name,))
