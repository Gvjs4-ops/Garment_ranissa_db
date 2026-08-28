#!/usr/bin/env python3

"""
============================================================
 Ranissa ERP Quality Gate
============================================================

Runs automated quality checks for the entire project.

Checks
------
✓ Python compilation
✓ ERP Doctor verification
✓ SQL migration ordering
✓ SQL syntax (optional: sqlfluff)
✓ Flake8 (optional)
✓ MyPy (optional)
✓ Bandit (optional)

Exit Code
---------
0 = PASS
1 = FAIL
"""

from pathlib import Path
import shutil
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parent.parent

results = []


# ----------------------------------------------------------
# OUTPUT
# ----------------------------------------------------------

def line():
    print("=" * 70)


def header(title):
    print()
    line()
    print(title)
    line()


def record(name, passed):

    results.append((name, passed))

    if passed:
        print(f"[PASS] {name}")
    else:
        print(f"[FAIL] {name}")


# ----------------------------------------------------------
# COMMAND
# ----------------------------------------------------------

def run(name, command, cwd=ROOT):

    print(f"\n>>> {name}")

    try:

        process = subprocess.run(
            command,
            cwd=cwd,
            capture_output=True,
            text=True,
        )

        if process.returncode == 0:
            record(name, True)
            return True

        record(name, False)

        if process.stdout:
            print(process.stdout)

        if process.stderr:
            print(process.stderr)

        return False

    except Exception as ex:

        record(name, False)
        print(ex)

        return False


# ----------------------------------------------------------
# OPTIONAL TOOL
# ----------------------------------------------------------

def optional(name, executable, args):

    if shutil.which(executable) is None:

        print(f"[SKIP] {name} (not installed)")
        return

    run(name, [executable] + args)


# ----------------------------------------------------------
# PYTHON
# ----------------------------------------------------------

def python_checks():

    header("PYTHON")

    run(

        "Compile Python",

        [

            sys.executable,
            "-m",
            "compileall",
            str(ROOT),

        ],

    )


# ----------------------------------------------------------
# ERP DOCTOR
# ----------------------------------------------------------

def doctor_checks():

    doctor = ROOT / "tools" / "erp-doctor"

    if not doctor.exists():

        record("ERP Doctor", False)
        return

    header("ERP DOCTOR")

    run(

        "ERP Doctor Verify",

        [

            sys.executable,
            "verify.py",

        ],

        cwd=doctor,

    )


# ----------------------------------------------------------
# SQL CHECKS
# ----------------------------------------------------------

def sql_checks():

    migrations = ROOT / "supabase" / "migrations"

    header("SQL")

    if not migrations.exists():

        record("Migration Folder", False)
        return

    files = sorted(migrations.glob("*.sql"))

    print(f"Found {len(files)} migration(s)")

    previous = 0
    ok = True

    for file in files:

        try:

            number = int(file.name.split("_")[0])

            if number <= previous:
                ok = False

            previous = number

        except Exception:

            ok = False

    record("Migration Order", ok)

    optional(

        "SQLFluff",

        "sqlfluff",

        ["lint", str(migrations)]

    )


# ----------------------------------------------------------
# OPTIONAL CHECKS
# ----------------------------------------------------------

def static_analysis():

    header("STATIC ANALYSIS")

    optional(

        "Flake8",

        "flake8",

        [str(ROOT)]

    )

    optional(

        "MyPy",

        "mypy",

        [str(ROOT)]

    )

    optional(

        "Bandit",

        "bandit",

        [

            "-r",

            str(ROOT)

        ]

    )


# ----------------------------------------------------------
# SUMMARY
# ----------------------------------------------------------

def summary(start):

    header("SUMMARY")

    passed = sum(1 for _, status in results if status)
    failed = sum(1 for _, status in results if not status)

    total = passed + failed

    for name, status in results:

        print(f"{name:<30} {'PASS' if status else 'FAIL'}")

    line()

    print(f"Passed : {passed}")
    print(f"Failed : {failed}")
    print(f"Total  : {total}")

    score = 0

    if total:
        score = (passed / total) * 100

    print(f"Score  : {score:.1f}%")

    print(f"Time   : {time.time()-start:.2f} sec")

    line()

    return failed == 0


# ----------------------------------------------------------
# MAIN
# ----------------------------------------------------------

def main():

    start = time.time()

    header("RANISSA ERP QUALITY GATE")

    python_checks()

    sql_checks()

    static_analysis()

    doctor_checks()

    success = summary(start)

    sys.exit(0 if success else 1)


if __name__ == "__main__":

    main()
