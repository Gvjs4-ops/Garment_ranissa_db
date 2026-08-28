"""
============================================================
Ranissa Tooling SDK
Console Printer
============================================================

Shared console output helpers used by all tools.

Used by:

- ERP Doctor
- Migration Linter
- ERP Audit
- ERP Scaffold
- Quality Gate
"""

from datetime import datetime


# ============================================================
# BASIC OUTPUT
# ============================================================

def info(message: str):

    print(f"[INFO] {message}")


def ok(message: str):

    print(f"[ OK ] {message}")


def warn(message: str):

    print(f"[WARN] {message}")


def fail(message: str):

    print(f"[FAIL] {message}")


# ============================================================
# SEPARATORS
# ============================================================

def line(length: int = 60):

    print("=" * length)


def divider(length: int = 60):

    print("-" * length)


def blank():

    print()


# ============================================================
# SECTIONS
# ============================================================

def start_section(title: str):

    line()

    info(title.upper())

    line()


def end_section(title: str):

    ok(f"{title} completed.")

    line()


# ============================================================
# HEADERS
# ============================================================

def header(title: str):

    print()

    line()

    print(title)

    line()


def subheader(title: str):

    print()

    divider()

    print(title)

    divider()


# ============================================================
# STATUS
# ============================================================

def status(name: str, passed: bool):

    if passed:

        ok(name)

    else:

        fail(name)


# ============================================================
# KEY VALUE
# ============================================================

def key_value(key: str, value):

    print(f"{key:<25}: {value}")


# ============================================================
# TIMESTAMP
# ============================================================

def timestamp():

    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
