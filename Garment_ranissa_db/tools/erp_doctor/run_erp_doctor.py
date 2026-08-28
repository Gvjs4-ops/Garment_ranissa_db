import argparse

from tools.erp_doctor.checks.database import run as database_check
from tools.erp_doctor.checks.inventory import run as inventory_check
from tools.erp_doctor.checks.production import run as production_check
from tools.erp_doctor.checks.accounting import run as accounting_check
from tools.erp_doctor.checks.security import run as security_check
from tools.erp_doctor.checks.performance import run as performance_check
from tools.erp_doctor.checks.costing import run as costing_check
from tools.erp_doctor.checks.schema import run as schema_check
from tools.erp_doctor.checks.integrity import run as integrity_check

def main():

    parser = argparse.ArgumentParser(
        prog="erp-doctor",
        description="Garment ERP Diagnostic Tool"
    )

    parser.add_argument(
        "module",
        choices=[
            "database",
            "inventory",
            "production",
            "accounting",
            "security",
            "performance",
            "costing",
            "schema",
            "integrity",
            "all",
        ],
    )

    args = parser.parse_args()

    if args.module in ("database", "all"):
        database_check()

    if args.module in ("inventory", "all"):
        inventory_check()

    if args.module in ("production", "all"):
        production_check()

    if args.module in ("accounting", "all"):
        accounting_check()

    if args.module in ("security", "all"):
        security_check()

    if args.module in ("performance", "all"):
        performance_check()

    if args.module in ("costing", "all"):
        costing_check()

    if args.module in ("schema", "all"):
        schema_check()

    if args.module in ("integrity", "all"):
        integrity_check()

if __name__ == "__main__":
    main()
