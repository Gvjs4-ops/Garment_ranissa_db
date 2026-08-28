"""
============================================================
Ranissa Tooling SDK
Checker Utilities
============================================================
"""

from tools.common.printer import (
    info,
    ok,
    warn,
    fail,
    start_section,
    end_section,
)

from tools.common.database import (
    execute_fetchall,
    execute_scalar,
    table_exists,
)


# ============================================================
# REQUIRED TABLES
# ============================================================

def require_tables(conn, module_name, required_tables):

    missing = []

    for table in required_tables:

        if not table_exists(conn, table):

            missing.append(table)

    if not missing:

        return True

    warn(f"{module_name} module is not installed.")

    for table in missing:

        warn(f"Missing table : {table}")

    return False


# ============================================================
# SQL CHECK
# ============================================================

def execute_check(conn, title, sql, params=None):

    info(title)

    try:

        rows = execute_fetchall(conn, sql, params)

        if not rows:

            ok("Passed")

            return True

        warn(f"{len(rows)} issue(s) found.")

        for row in rows[:10]:

            print("   ", row)

        if len(rows) > 10:

            print(f"   ... {len(rows)-10} more")

        return False

    except Exception as ex:

        conn.rollback()

        fail(str(ex))

        return False


# ============================================================
# SCALAR CHECK
# ============================================================

def execute_scalar_check(conn, title, sql, expected=0, params=None):

    info(title)

    try:

        value = execute_scalar(conn, sql, params)

        if value == expected:

            ok("Passed")

            return True

        warn(f"Expected {expected}, Found {value}")

        return False

    except Exception as ex:

        conn.rollback()

        fail(str(ex))

        return False


# ============================================================
# OBJECT CHECKS
# ============================================================

def require_functions(conn, functions):

    missing = []

    for function in functions:

        from common.database import function_exists

        if not function_exists(conn, function):

            missing.append(function)

    return missing


def require_extensions(conn, extensions):

    missing = []

    for extension in extensions:

        from common.database import extension_exists

        if not extension_exists(conn, extension):

            missing.append(extension)

    return missing


# ============================================================
# MODULE HELPERS
# ============================================================

def begin(module):

    start_section(module)


def end(module):

    end_section(module)
