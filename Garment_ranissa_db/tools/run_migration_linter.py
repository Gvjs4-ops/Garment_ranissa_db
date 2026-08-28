#!/usr/bin/env python3

"""
============================================================
Ranissa ERP Migration Linter
============================================================
"""

import sys
from pathlib import Path

from run_migration_linter.scanner import (
    discover,
    statistics,
)

from run_migration_linter.parser import (
    parse_all,
)

from run_migration_linter.validator import (
    validate,
)

from run_migration_linter.report import (
    print_summary,
)

from run_migration_linter.utils import (
    info,
    line,
    success,
    failure,
)


# ------------------------------------------------------------
# MAIN
# ------------------------------------------------------------

def main():

    root = Path(__file__).resolve().parent.parent

    migration_dir = root / "supabase" / "migrations"

    line()
    info("RANISSA ERP MIGRATION LINTER")
    line()

    info(f"Scanning : {migration_dir}")

    try:

        migrations = discover(migration_dir)

    except Exception as ex:

        print(ex)

        failure()

        return

    stats = statistics(migrations)

    info(f"Migration Files : {stats['files']}")

    info(f"Empty Files     : {stats['empty']}")

    info(f"Invalid Names   : {stats['invalid']}")

    info(f"Duplicate IDs   : {stats['duplicates']}")

    parsed = parse_all(migrations)

    report = validate(parsed)

    passed = print_summary(report)

    if passed:

        success()

    failure()


# ------------------------------------------------------------
# ENTRY
# ------------------------------------------------------------

if __name__ == "__main__":

    main()
