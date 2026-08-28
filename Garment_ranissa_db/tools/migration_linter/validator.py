"""
============================================================
Migration Validator
============================================================

Validates parsed migration objects.

Checks:
- Duplicate tables
- Duplicate functions
- Duplicate indexes
- Duplicate triggers
- Duplicate views
- Duplicate types
"""

from collections import defaultdict


# ------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------

def _find_duplicates(objects, attr):

    seen = defaultdict(list)

    for obj in objects:

        key = getattr(obj, attr).lower()

        seen[key].append(obj.migration)

    duplicates = {}

    for key, migrations in seen.items():

        if len(migrations) > 1:

            duplicates[key] = migrations

    return duplicates


# ------------------------------------------------------------
# TABLES
# ------------------------------------------------------------

def validate_tables(results):

    tables = []

    for result in results:

        tables.extend(result.tables)

    return _find_duplicates(tables, "name")


# ------------------------------------------------------------
# FUNCTIONS
# ------------------------------------------------------------

def validate_functions(results):

    functions = []

    for result in results:

        functions.extend(result.functions)

    return _find_duplicates(functions, "name")


# ------------------------------------------------------------
# INDEXES
# ------------------------------------------------------------

def validate_indexes(results):

    indexes = []

    for result in results:

        indexes.extend(result.indexes)

    return _find_duplicates(indexes, "name")


# ------------------------------------------------------------
# TRIGGERS
# ------------------------------------------------------------

def validate_triggers(results):

    triggers = []

    for result in results:

        triggers.extend(result.triggers)

    return _find_duplicates(triggers, "name")


# ------------------------------------------------------------
# VIEWS
# ------------------------------------------------------------

def validate_views(results):

    views = []

    for result in results:

        views.extend(result.views)

    return _find_duplicates(views, "name")


# ------------------------------------------------------------
# TYPES
# ------------------------------------------------------------

def validate_types(results):

    types = []

    for result in results:

        types.extend(result.types)

    return _find_duplicates(types, "name")


# ------------------------------------------------------------
# MASTER VALIDATOR
# ------------------------------------------------------------

def validate(results):

    report = {

        "tables": validate_tables(results),

        "functions": validate_functions(results),

        "indexes": validate_indexes(results),

        "triggers": validate_triggers(results),

        "views": validate_views(results),

        "types": validate_types(results),

    }

    return report
