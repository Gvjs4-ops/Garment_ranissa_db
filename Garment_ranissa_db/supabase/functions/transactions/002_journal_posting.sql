/*
===============================================================================
002_journal_posting.sql

Purpose:
    Generic Journal Posting Functions

These functions are reused by:
    - Goods Receipt
    - Purchase Invoice
    - Sales Invoice
    - Production
    - Inventory Adjustment
    - Stock Transfer
===============================================================================
*/

-- ============================================================================
-- Create Journal Header
-- ============================================================================

CREATE OR REPLACE FUNCTION create_journal(

    p_company_id UUID,

    p_document_type TEXT,

    p_document_id UUID,

    p_document_number TEXT,

    p_posting_date DATE,

    p_reference TEXT,

    p_remarks TEXT,

    p_created_by UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_journal_id UUID;

BEGIN

    INSERT INTO journal (

        company_id,

        document_type,

        document_id,

        document_number,

        posting_date,

        reference,

        remarks,

        status,

        created_by

    )

    VALUES (

        p_company_id,

        p_document_type,

        p_document_id,

        p_document_number,

        p_posting_date,

        p_reference,

        p_remarks,

        'DRAFT',

        p_created_by

    )

    RETURNING id

    INTO v_journal_id;

    RETURN v_journal_id;

END;

$$;

-- ============================================================================
-- Create Journal Line
-- ============================================================================

CREATE OR REPLACE FUNCTION create_journal_line(

    p_journal_id UUID,

    p_account_id UUID,

    p_debit NUMERIC,

    p_credit NUMERIC,

    p_remarks TEXT

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    INSERT INTO journal_line (

        journal_id,

        account_id,

        debit,

        credit,

        remarks

    )

    VALUES (

        p_journal_id,

        p_account_id,

        COALESCE(p_debit,0),

        COALESCE(p_credit,0),

        p_remarks

    );

END;

$$;

-- ============================================================================
-- Validate Journal
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_journal(

    p_journal_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_debit NUMERIC;

    v_credit NUMERIC;

BEGIN

    SELECT

        COALESCE(SUM(debit),0),

        COALESCE(SUM(credit),0)

    INTO

        v_debit,

        v_credit

    FROM journal_line

    WHERE journal_id = p_journal_id;

    IF v_debit <> v_credit THEN

        RAISE EXCEPTION
        'Journal is not balanced. Debit=% Credit=%',
        v_debit,
        v_credit;

    END IF;

END;

$$;

-- ============================================================================
-- Post Journal
-- ============================================================================

CREATE OR REPLACE FUNCTION post_journal(

    p_journal_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    PERFORM validate_journal(
        p_journal_id
    );

    UPDATE journal

    SET

        status='POSTED',

        posted_at=NOW()

    WHERE id=p_journal_id;

END;

$$;

-- ============================================================================
-- Cancel Journal
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_journal(

    p_journal_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE journal

    SET

        status='CANCELLED'

    WHERE id=p_journal_id;

END;

$$;
