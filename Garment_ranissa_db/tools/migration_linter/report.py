"""
============================================================
Migration Linter Report
============================================================
"""

from tools.common.printer import (
    info,
    ok,
    warn,
    fail,
    line,
    divider,
    blank,
    header,
    subheader,
    start_section,
    end_section,
    status,
    key_value,
)
# ------------------------------------------------------------
# DUPLICATE SECTION
# ------------------------------------------------------------

def print_duplicates(title, duplicates):

    info("")
    info(title)
    info("-" * len(title))

    if not duplicates:

        ok("No duplicates found.")
        return 0

    fail(f"{len(duplicates)} duplicate object(s) found.")

    count = 0

    for name, migrations in sorted(duplicates.items()):

        print()

        print(f"  {name}")

        for migration in migrations:

            print(f"     - {migration}")

        count += 1

    return count


# ------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------

def print_summary(report):

    line()

    info("MIGRATION LINTER SUMMARY")

    line()

    total_errors = 0

    total_errors += print_duplicates(
        "Duplicate Tables",
        report["tables"],
    )

    total_errors += print_duplicates(
        "Duplicate Functions",
        report["functions"],
    )

    total_errors += print_duplicates(
        "Duplicate Indexes",
        report["indexes"],
    )

    total_errors += print_duplicates(
        "Duplicate Triggers",
        report["triggers"],
    )

    total_errors += print_duplicates(
        "Duplicate Views",
        report["views"],
    )

    total_errors += print_duplicates(
        "Duplicate Types",
        report["types"],
    )

    line()

    if total_errors == 0:

        ok("Migration Linter PASSED")

    else:

        fail(f"Migration Linter FAILED ({total_errors} error(s))")

    line()

    return total_errors == 0
