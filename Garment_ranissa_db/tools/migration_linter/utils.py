"""
============================================================
Migration Linter Utilities
============================================================
"""

import sys


# ------------------------------------------------------------
# OUTPUT
# ------------------------------------------------------------

def line():

    print("=" * 60)


def info(message):

    print(f"[INFO] {message}")


def ok(message):

    print(f"[ OK ] {message}")


def warn(message):

    print(f"[WARN] {message}")


def fail(message):

    print(f"[FAIL] {message}")


# ------------------------------------------------------------
# EXIT
# ------------------------------------------------------------

def success():

    sys.exit(0)


def failure():

    sys.exit(1)
