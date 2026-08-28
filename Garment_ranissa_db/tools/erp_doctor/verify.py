#!/usr/bin/env python3

"""
Ranissa ERP Verification Tool

Runs:
- Python compilation
- ERP Doctor modules

Exit Code:
    0 = Success
    1 = Failure
"""

import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent

RESULTS = []


# ------------------------------------------------------------
# OUTPUT
# ------------------------------------------------------------

def line():
    print("=" * 65)


def title(text):
    line()
    print(text)
    line()


def success(name):
    print(f"[PASS] {name}")
    RESULTS.append(True)


def failure(name):
    print(f"[FAIL] {name}")
    RESULTS.append(False)


# ------------------------------------------------------------
# RUN COMMAND
# ------------------------------------------------------------

def run_command(name, command):

    print(f"\n>>> {name}")

    result = subprocess.run(
        command,
        cwd=ROOT,
        capture_output=True,
        text=True,
    )

    if result.returncode == 0:
        success(name)
    else:
        failure(name)

        if result.stdout:
            print(result.stdout)

        if result.stderr:
            print(result.stderr)

    return result.returncode == 0


# ------------------------------------------------------------
# PYTHON COMPILATION
# ------------------------------------------------------------

def verify_python():

    print()

    return run_command(

        "Python Syntax",

        [
            sys.executable,
            "-m",
            "compileall",
            "."
        ]

    )


# ------------------------------------------------------------
# ERP DOCTOR
# ------------------------------------------------------------

def verify_database():

    return run_command(

        "Database Check",

        [

            sys.executable,

            "erp-doctor.py",

            "database"

        ]

    )


def verify_schema():

    return run_command(

        "Schema Check",

        [

            sys.executable,

            "erp-doctor.py",

            "schema"

        ]

    )


def verify_integrity():

    return run_command(

        "Integrity Check",

        [

            sys.executable,

            "erp-doctor.py",

            "integrity"

        ]

    )


def verify_performance():

    return run_command(

        "Performance Check",

        [

            sys.executable,

            "erp-doctor.py",

            "performance"

        ]

    )


def verify_security():

    return run_command(

        "Security Check",

        [

            sys.executable,

            "erp-doctor.py",

            "security"

        ]

    )


# ------------------------------------------------------------
# OPTIONAL TOOLS
# ------------------------------------------------------------

def optional_tool(name, executable):

    print(f"\n>>> {name}")

    result = subprocess.run(

        [executable, "--version"],

        cwd=ROOT,

        capture_output=True,

        text=True,

    )

    if result.returncode == 0:
        success(name)
        return True

    print(f"Skipped ({name} not installed)")
    return False


# ------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------

def summary(start):

    duration = time.time() - start

    title("RANISSA ERP VERIFICATION SUMMARY")

    labels = [

        "Python Syntax",

        "Database",

        "Schema",

        "Integrity",

        "Performance",

        "Security"

    ]

    for label, status in zip(labels, RESULTS):

        state = "PASS" if status else "FAIL"

        print(f"{label:<25} {state}")

    line()

    print(f"Time Elapsed : {duration:.2f} seconds")

    passed = all(RESULTS)

    print(f"Overall      : {'PASS' if passed else 'FAIL'}")

    line()

    return passed


# ------------------------------------------------------------
# MAIN
# ------------------------------------------------------------

def main():

    start = time.time()

    title("RANISSA ERP VERIFY")

    verify_python()

    verify_database()

    verify_schema()

    verify_integrity()

    verify_performance()

    verify_security()

    ok = summary(start)

    sys.exit(0 if ok else 1)


if __name__ == "__main__":

    main()
