"""
============================================================
Migration SQL Parser
============================================================

Extracts SQL objects from migration files.

This is NOT a full SQL parser.
It only discovers objects required by the linter.
"""

import re

from .models import (
    ParseResult,
    Table,
    Function,
    Index,
    Trigger,
    View,
    DbType,
)


# ------------------------------------------------------------
# REGEX
# ------------------------------------------------------------

TABLE_RE = re.compile(
    r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_.\"]+)",
    re.IGNORECASE,
)

FUNCTION_RE = re.compile(
    r"CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([a-zA-Z0-9_.\"]+)",
    re.IGNORECASE,
)

INDEX_RE = re.compile(
    r"CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_.\"]+)",
    re.IGNORECASE,
)

TRIGGER_RE = re.compile(
    r"CREATE\s+TRIGGER\s+([a-zA-Z0-9_.\"]+)",
    re.IGNORECASE,
)

VIEW_RE = re.compile(
    r"CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+([a-zA-Z0-9_.\"]+)",
    re.IGNORECASE,
)

TYPE_RE = re.compile(
    r"CREATE\s+TYPE\s+([a-zA-Z0-9_.\"]+)",
    re.IGNORECASE,
)


# ------------------------------------------------------------
# CLEAN OBJECT NAME
# ------------------------------------------------------------

def clean(name: str) -> str:

    return name.replace('"', "").strip()


# ------------------------------------------------------------
# PARSE ONE FILE
# ------------------------------------------------------------

def parse(migration):

    result = ParseResult()

    sql = migration.sql

    # ---------------- TABLES ----------------

    for match in TABLE_RE.finditer(sql):

        result.tables.append(

            Table(

                name=clean(match.group(1)),

                migration=migration.filename,

            )

        )

    # ---------------- FUNCTIONS ----------------

    for match in FUNCTION_RE.finditer(sql):

        result.functions.append(

            Function(

                name=clean(match.group(1)),

                migration=migration.filename,

            )

        )

    # ---------------- INDEXES ----------------

    for match in INDEX_RE.finditer(sql):

        result.indexes.append(

            Index(

                name=clean(match.group(1)),

                table="",

                migration=migration.filename,

            )

        )

    # ---------------- TRIGGERS ----------------

    for match in TRIGGER_RE.finditer(sql):

        result.triggers.append(

            Trigger(

                name=clean(match.group(1)),

                table="",

                migration=migration.filename,

            )

        )

    # ---------------- VIEWS ----------------

    for match in VIEW_RE.finditer(sql):

        result.views.append(

            View(

                name=clean(match.group(1)),

                migration=migration.filename,

            )

        )

    # ---------------- TYPES ----------------

    for match in TYPE_RE.finditer(sql):

        result.types.append(

            DbType(

                name=clean(match.group(1)),

                migration=migration.filename,

            )

        )

    return result


# ------------------------------------------------------------
# PARSE ALL
# ------------------------------------------------------------

def parse_all(migrations):

    results = []

    for migration in migrations:

        results.append(

            parse(migration)

        )

    return results
