"""
============================================================
Migration Linter Models
============================================================

Shared data structures used by the migration linter.
"""

from dataclasses import dataclass, field
from pathlib import Path


# ------------------------------------------------------------
# MIGRATION FILE
# ------------------------------------------------------------

@dataclass
class MigrationFile:

    filename: str

    path: Path

    number: int | None

    description: str | None

    sql: str

    valid_name: bool

    empty: bool


# ------------------------------------------------------------
# TABLE
# ------------------------------------------------------------

@dataclass
class Table:

    name: str

    migration: str

    columns: list[str] = field(default_factory=list)

    constraints: list[str] = field(default_factory=list)

    indexes: list[str] = field(default_factory=list)

    triggers: list[str] = field(default_factory=list)


# ------------------------------------------------------------
# FUNCTION
# ------------------------------------------------------------

@dataclass
class Function:

    name: str

    migration: str


# ------------------------------------------------------------
# INDEX
# ------------------------------------------------------------

@dataclass
class Index:

    name: str

    table: str

    migration: str


# ------------------------------------------------------------
# TRIGGER
# ------------------------------------------------------------

@dataclass
class Trigger:

    name: str

    table: str

    migration: str


# ------------------------------------------------------------
# TYPE
# ------------------------------------------------------------

@dataclass
class DbType:

    name: str

    migration: str


# ------------------------------------------------------------
# VIEW
# ------------------------------------------------------------

@dataclass
class View:

    name: str

    migration: str


# ------------------------------------------------------------
# PARSER RESULT
# ------------------------------------------------------------

@dataclass
class ParseResult:

    tables: list[Table] = field(default_factory=list)

    functions: list[Function] = field(default_factory=list)

    indexes: list[Index] = field(default_factory=list)

    triggers: list[Trigger] = field(default_factory=list)

    views: list[View] = field(default_factory=list)

    types: list[DbType] = field(default_factory=list)
