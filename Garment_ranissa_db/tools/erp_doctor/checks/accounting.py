from tools.common.database import get_connection
from tools.common.checker import (
    execute_check,
    require_tables,
    start_section,
    end_section,
)
from tools.common.printer import ok, warn, fail, info
from tools.common.database import table_exists


# ------------------------------------------------------------
# UNBALANCED JOURNALS
# ------------------------------------------------------------

def check_unbalanced_journals(conn):

    execute_check(

        conn,

        "Checking unbalanced journal entries...",

        """
        SELECT
            journal_entry_id,
            SUM(debit_amount) AS debit,
            SUM(credit_amount) AS credit
        FROM journal_entry_line
        GROUP BY journal_entry_id
        HAVING SUM(debit_amount) <> SUM(credit_amount);
        """

    )


# ------------------------------------------------------------
# ORPHAN JOURNAL LINES
# ------------------------------------------------------------

def check_orphan_lines(conn):

    execute_check(

        conn,

        "Checking orphan journal lines...",

        """
        SELECT
            l.journal_entry_line_id
        FROM journal_entry_line l
        LEFT JOIN journal_entry h
            ON h.journal_entry_id = l.journal_entry_id
        WHERE h.journal_entry_id IS NULL;
        """

    )


# ------------------------------------------------------------
# INVALID GL ACCOUNT
# ------------------------------------------------------------

def check_invalid_accounts(conn):

    execute_check(

        conn,

        "Checking invalid GL accounts...",

        """
        SELECT
            journal_entry_line_id
        FROM journal_entry_line l
        LEFT JOIN chart_of_account a
            ON a.account_id = l.account_id
        WHERE a.account_id IS NULL;
        """

    )


# ------------------------------------------------------------
# DUPLICATE VOUCHERS
# ------------------------------------------------------------

def check_duplicate_vouchers(conn):

    execute_check(

        conn,

        "Checking duplicate voucher numbers...",

        """
        SELECT
            voucher_no,
            COUNT(*)
        FROM journal_entry
        GROUP BY voucher_no
        HAVING COUNT(*) > 1;
        """

    )


# ------------------------------------------------------------
# FUTURE JOURNALS
# ------------------------------------------------------------

def check_future_entries(conn):

    execute_check(

        conn,

        "Checking future dated journals...",

        """
        SELECT
            voucher_no,
            journal_date
        FROM journal_entry
        WHERE journal_date > CURRENT_DATE;
        """

    )


# ------------------------------------------------------------
# INVALID ACCOUNT TYPE
# ------------------------------------------------------------

def check_account_type(conn):

    execute_check(

        conn,

        "Checking invalid account types...",

        """
        SELECT
            account_code,
            account_name
        FROM chart_of_account
        WHERE account_type IS NULL;
        """

    )


# ------------------------------------------------------------
# INACTIVE ACCOUNT USED
# ------------------------------------------------------------

def check_inactive_accounts(conn):

    execute_check(

        conn,

        "Checking inactive accounts in journals...",

        """
        SELECT
            DISTINCT l.account_id
        FROM journal_entry_line l
        JOIN chart_of_account a
            ON a.account_id=l.account_id
        WHERE a.is_active = FALSE;
        """

    )


# ------------------------------------------------------------
# NEGATIVE DEBIT/CREDIT
# ------------------------------------------------------------

def check_negative_values(conn):

    execute_check(

        conn,

        "Checking negative debit/credit amounts...",

        """
        SELECT
            journal_entry_line_id
        FROM journal_entry_line
        WHERE debit_amount < 0
           OR credit_amount < 0;
        """

    )


# ------------------------------------------------------------
# POSTED WITHOUT LINES
# ------------------------------------------------------------

def check_empty_journals(conn):

    execute_check(

        conn,

        "Checking journal entries without lines...",

        """
        SELECT
            h.journal_entry_id,
            h.voucher_no
        FROM journal_entry h
        LEFT JOIN journal_entry_line l
            ON l.journal_entry_id=h.journal_entry_id
        WHERE l.journal_entry_line_id IS NULL;
        """

    )


# ------------------------------------------------------------
# RUN
# ------------------------------------------------------------

def run():

    #info("=" * 60)
    #info("ACCOUNTING CHECK")
    #info("=" * 60)
    start_section("ACCOUNTING CHECK")

    conn = get_connection()

    try:

        required_tables = [

            "journal_entry",
            "journal_entry_line",
            "chart_of_account"

        ]

        missing = []

        for table in required_tables:

            if not table_exists(conn, table):
                missing.append(table)

        if missing:

            warn("Accounting module is not installed.")

            for table in missing:
                warn(f"Missing table: {table}")

            return

        check_unbalanced_journals(conn)
        check_orphan_lines(conn)
        check_invalid_accounts(conn)
        check_duplicate_vouchers(conn)
        check_future_entries(conn)
        check_account_type(conn)
        check_inactive_accounts(conn)
        check_negative_values(conn)
        check_empty_journals(conn)

        #ok("Accounting check completed.")
        end_section("Accounting check completed")

    finally:

        conn.close()
