/*
===============================================================================
002_purchase_invoice.sql

Purpose:
    Purchase Invoice Processing

Responsibilities
----------------
- Create Purchase Invoice
- Add Invoice Lines
- Calculate Invoice Totals
- Create Vendor Payable
- Post Accounting Journal
- Complete Purchase Invoice

===============================================================================
*/

-- ============================================================================
-- Create Purchase Invoice
-- ============================================================================

CREATE OR REPLACE FUNCTION create_purchase_invoice(

    p_company_id UUID,
    p_supplier_id UUID,
    p_purchase_order_id UUID,
    p_goods_receipt_id UUID,
    p_invoice_number TEXT,
    p_supplier_invoice_number TEXT,
    p_invoice_date DATE,
    p_due_date DATE,
    p_currency_code TEXT,
    p_exchange_rate NUMERIC,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_purchase_invoice_id UUID;

BEGIN

    INSERT INTO purchase_invoice(

        company_id,
        supplier_id,
        purchase_order_id,
        goods_receipt_id,
        invoice_number,
        supplier_invoice_number,
        invoice_date,
        due_date,
        currency_code,
        exchange_rate,
        created_by

    )

    VALUES(

        p_company_id,
        p_supplier_id,
        p_purchase_order_id,
        p_goods_receipt_id,
        p_invoice_number,
        p_supplier_invoice_number,
        p_invoice_date,
        p_due_date,
        p_currency_code,
        p_exchange_rate,
        p_user_id

    )

    RETURNING id
    INTO v_purchase_invoice_id;

    RETURN v_purchase_invoice_id;

END;

$$;

-- ============================================================================
-- Add Purchase Invoice Line
-- ============================================================================

CREATE OR REPLACE FUNCTION add_purchase_invoice_line(

    p_purchase_invoice_id UUID,
    p_purchase_order_line_id UUID,
    p_item_id UUID,
    p_quantity NUMERIC,
    p_unit_price NUMERIC,
    p_discount_percent NUMERIC,
    p_tax_percent NUMERIC

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_line_id UUID;

    v_line_amount NUMERIC;

BEGIN

    v_line_amount := p_quantity * p_unit_price;

    INSERT INTO purchase_invoice_line(

        purchase_invoice_id,
        purchase_order_line_id,
        item_id,
        quantity,
        unit_price,
        discount_percent,
        tax_percent,
        line_amount

    )

    VALUES(

        p_purchase_invoice_id,
        p_purchase_order_line_id,
        p_item_id,
        p_quantity,
        p_unit_price,
        p_discount_percent,
        p_tax_percent,
        v_line_amount

    )

    RETURNING id
    INTO v_line_id;

    RETURN v_line_id;

END;

$$;

-- ============================================================================
-- Calculate Purchase Invoice Totals
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_purchase_invoice_total(

    p_purchase_invoice_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE purchase_invoice pi

    SET

        subtotal = x.subtotal,

        tax_amount = x.tax_amount,

        total_amount = x.total_amount,

        balance_amount = x.total_amount - pi.paid_amount,

        updated_at = NOW()

    FROM (

        SELECT

            purchase_invoice_id,

            SUM(line_amount) AS subtotal,

            SUM(line_amount * tax_percent / 100) AS tax_amount,

            SUM(
                line_amount +
                (line_amount * tax_percent / 100)
            ) AS total_amount

        FROM purchase_invoice_line

        WHERE purchase_invoice_id = p_purchase_invoice_id

        GROUP BY purchase_invoice_id

    ) x

    WHERE pi.id = x.purchase_invoice_id;

END;

$$;

-- ============================================================================
-- Create Vendor Payable
-- ============================================================================

CREATE OR REPLACE FUNCTION create_vendor_payable(

    p_purchase_invoice_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_payable_id UUID;

BEGIN

    INSERT INTO vendor_payable(

        company_id,
        supplier_id,
        purchase_invoice_id,
        invoice_date,
        due_date,
        invoice_amount,
        outstanding_amount

    )

    SELECT

        company_id,
        supplier_id,
        id,
        invoice_date,
        due_date,
        total_amount,
        balance_amount

    FROM purchase_invoice

    WHERE id = p_purchase_invoice_id

    RETURNING id
    INTO v_payable_id;

    RETURN v_payable_id;

END;

$$;

-- ============================================================================
-- Complete Purchase Invoice
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_purchase_invoice(

    p_purchase_invoice_id UUID,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    PERFORM calculate_purchase_invoice_total(
        p_purchase_invoice_id
    );

    PERFORM create_vendor_payable(
        p_purchase_invoice_id
    );

    UPDATE purchase_invoice

    SET

        status = 'POSTED',

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_purchase_invoice_id;

    /*
    --------------------------------------------------------------------------

    Future Integration

    PERFORM post_purchase_journal(
        p_purchase_invoice_id
    );

    PERFORM update_supplier_balance(
        p_purchase_invoice_id
    );

    PERFORM update_purchase_order_invoice_quantity(
        p_purchase_invoice_id
    );

    PERFORM close_purchase_order_if_complete(
        p_purchase_invoice_id
    );

    --------------------------------------------------------------------------
    */

END;

$$;
