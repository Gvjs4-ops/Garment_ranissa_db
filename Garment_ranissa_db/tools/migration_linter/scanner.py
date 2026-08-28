"""
============================================================
Migration Scanner
============================================================

Responsible for:

- Finding migration files
- Validating filenames
- Reading file contents
- Returning MigrationFile objects
"""

from pathlib import Path
import re

from .models import MigrationFile


# ------------------------------------------------------------
# CONSTANTS
# ------------------------------------------------------------

MIGRATION_PATTERN = re.compile(
    r"^(\d{3})_([a-z0-9_]+)\.sql$"
)


# ------------------------------------------------------------
# FIND FILES
# ------------------------------------------------------------

def discover(directory: Path):

    if not directory.exists():
        raise FileNotFoundError(directory)

    files = sorted(directory.glob("*.sql"))

    migrations = []

    for file in files:

        migrations.append(read_file(file))

    return migrations


# ------------------------------------------------------------
# READ FILE
# ------------------------------------------------------------

def read_file(path: Path):

    text = path.read_text(
        encoding="utf-8"
    )

    match = MIGRATION_PATTERN.match(path.name)

    valid_name = match is not None

    number = None
    description = None

    if valid_name:

        number = int(match.group(1))

        description = match.group(2)

    return MigrationFile(

        filename=path.name,

        path=path,

        number=number,

        description=description,

        sql=text,

        valid_name=valid_name,

        empty=(len(text.strip()) == 0),

    )


# ------------------------------------------------------------
# DUPLICATE NUMBERS
# ------------------------------------------------------------

def duplicate_numbers(migrations):

    seen = {}

    duplicates = []

    for migration in migrations:

        if migration.number is None:
            continue

        if migration.number in seen:

            duplicates.append(migration.number)

        else:

            seen[migration.number] = migration.filename

    return sorted(set(duplicates))


# ------------------------------------------------------------
# INVALID FILENAMES
# ------------------------------------------------------------

def invalid_filenames(migrations):

    return [

        migration

        for migration in migrations

        if not migration.valid_name

    ]


# ------------------------------------------------------------
# EMPTY FILES
# ------------------------------------------------------------

def empty_files(migrations):

    return [

        migration

        for migration in migrations

        if migration.empty

    ]


# ------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------

def statistics(migrations):

    return {

        "files": len(migrations),

        "empty": len(empty_files(migrations)),

        "invalid": len(invalid_filenames(migrations)),

        "duplicates": len(duplicate_numbers(migrations)),

    }
