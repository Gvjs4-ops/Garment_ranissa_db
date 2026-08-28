BEGIN;

------------------------------------------------------------
-- CREATE JOURNAL ENTRY
------------------------------------------------------------

CREATE OR REPLACE FUNCTION create_journal_entry(

    p_company_id UUID,
    p_reference_type VARCHAR,
    p_reference_id UUID,
    p_journal_date DATE,
    p_remarks TEXT

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_journal_id UUID;

    v_fiscal_year UUID;

BEGIN

    SELECT id

    INTO v_fiscal_year

    FROM fiscal_year

    WHERE company_id = p_company_id
      AND p_journal_date BETWEEN start_date AND end_date
      AND is_closed = FALSE

    LIMIT 1;

    IF v_fiscal_year IS NULL THEN

        RAISE EXCEPTION 'No open fiscal year found.';

    END IF;

    INSERT INTO journal_entry(

        tenant_id,
        company_id,
        fiscal_year_id,
        journal_number,
        journal_date,
        reference_type,
        reference_id,
        remarks,
        status

    )

    VALUES(

        current_tenant_id(),
        p_company_id,
        v_fiscal_year,

        generate_document_number(
            p_company_id,
            'JOURNAL_ENTRY',
            to_char(p_journal_date,'YYYY')
        ),

        p_journal_date,
        p_reference_type,
        p_reference_id,
        p_remarks,
        'POSTED'

    )

    RETURNING id

    INTO v_journal_id;

    RETURN v_journal_id;

END;

$$;

------------------------------------------------------------
-- ADD JOURNAL LINE
------------------------------------------------------------

CREATE OR REPLACE FUNCTION add_journal_line(

    p_journal_id UUID,
    p_account UUID,
    p_cost_center UUID,
    p_debit NUMERIC,
    p_credit NUMERIC,
    p_narration TEXT

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_line INTEGER;

BEGIN

    SELECT COALESCE(MAX(line_no),0)+1

    INTO v_line

    FROM journal_entry_line

    WHERE journal_entry_id=p_journal_id;

    INSERT INTO journal_entry_line(

        journal_entry_id,
        line_no,
        account_id,
        cost_center_id,
        debit,
        credit,
        narration

    )

    VALUES(

        p_journal_id,
        v_line,
        p_account,
        p_cost_center,
        p_debit,
        p_credit,
        p_narration

    );

END;

$$;

------------------------------------------------------------
-- POST PURCHASE JOURNAL
------------------------------------------------------------

CREATE OR REPLACE FUNCTION post_purchase_journal(

    p_goods_receipt UUID,
    p_inventory_account UUID,
    p_grni_account UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_company UUID;

    v_amount NUMERIC(18,2);

    v_journal UUID;

BEGIN

    SELECT

        gr.company_id,
        COALESCE(SUM(gri.accepted_quantity*gri.unit_cost),0)

    INTO

        v_company,
        v_amount

    FROM goods_receipt gr

    JOIN goods_receipt_item gri
      ON gri.goods_receipt_id=gr.id

    WHERE gr.id=p_goods_receipt

    GROUP BY gr.company_id;

    v_journal:=create_journal_entry(

        v_company,
        'GOODS_RECEIPT',
        p_goods_receipt,
        CURRENT_DATE,
        'Purchase Posting'

    );

    PERFORM add_journal_line(
        v_journal,
        p_inventory_account,
        NULL,
        v_amount,
        0,
        'Inventory'
    );

    PERFORM add_journal_line(
        v_journal,
        p_grni_account,
        NULL,
        0,
        v_amount,
        'GRNI'
    );

    RETURN v_journal;

END;

$$;

------------------------------------------------------------
-- POST SALES JOURNAL
------------------------------------------------------------

CREATE OR REPLACE FUNCTION post_sales_journal(

    p_delivery UUID,
    p_receivable_account UUID,
    p_sales_account UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_company UUID;

    v_amount NUMERIC(18,2);

    v_journal UUID;

BEGIN

    SELECT

        dn.company_id,
        COALESCE(SUM(dni.delivered_quantity*dni.unit_price),0)

    INTO

        v_company,
        v_amount

    FROM delivery_note dn

    JOIN delivery_note_item dni
      ON dni.delivery_note_id=dn.id

    WHERE dn.id=p_delivery

    GROUP BY dn.company_id;

    v_journal:=create_journal_entry(

        v_company,
        'DELIVERY_NOTE',
        p_delivery,
        CURRENT_DATE,
        'Sales Posting'

    );

    PERFORM add_journal_line(
        v_journal,
        p_receivable_account,
        NULL,
        v_amount,
        0,
        'Accounts Receivable'
    );

    PERFORM add_journal_line(
        v_journal,
        p_sales_account,
        NULL,
        0,
        v_amount,
        'Sales Revenue'
    );

    RETURN v_journal;

END;

$$;

------------------------------------------------------------
-- POST INVENTORY ADJUSTMENT
------------------------------------------------------------

CREATE OR REPLACE FUNCTION post_inventory_adjustment(

    p_company UUID,
    p_reference UUID,
    p_adjustment_account UUID,
    p_inventory_account UUID,
    p_amount NUMERIC

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_journal UUID;

BEGIN

    v_journal:=create_journal_entry(

        p_company,
        'STOCK_ADJUSTMENT',
        p_reference,
        CURRENT_DATE,
        'Inventory Adjustment'

    );

    IF p_amount>=0 THEN

        PERFORM add_journal_line(
            v_journal,
            p_inventory_account,
            NULL,
            p_amount,
            0,
            'Inventory Increase'
        );

        PERFORM add_journal_line(
            v_journal,
            p_adjustment_account,
            NULL,
            0,
            p_amount,
            'Adjustment'
        );

    ELSE

        PERFORM add_journal_line(
            v_journal,
            p_adjustment_account,
            NULL,
            ABS(p_amount),
            0,
            'Adjustment'
        );

        PERFORM add_journal_line(
            v_journal,
            p_inventory_account,
            NULL,
            0,
            ABS(p_amount),
            'Inventory Decrease'
        );

    END IF;

    RETURN v_journal;

END;

$$;

------------------------------------------------------------
-- POST PRODUCTION JOURNAL
------------------------------------------------------------

CREATE OR REPLACE FUNCTION post_production_journal(

    p_company UUID,
    p_production UUID,
    p_fg_account UUID,
    p_wip_account UUID,
    p_amount NUMERIC

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_journal UUID;

BEGIN

    v_journal:=create_journal_entry(

        p_company,
        'PRODUCTION_ORDER',
        p_production,
        CURRENT_DATE,
        'Production Completion'

    );

    PERFORM add_journal_line(

        v_journal,
        p_fg_account,
        NULL,
        p_amount,
        0,
        'Finished Goods'

    );

    PERFORM add_journal_line(

        v_journal,
        p_wip_account,
        NULL,
        0,
        p_amount,
        'Work In Progress'

    );

    RETURN v_journal;

END;

$$;

COMMIT;