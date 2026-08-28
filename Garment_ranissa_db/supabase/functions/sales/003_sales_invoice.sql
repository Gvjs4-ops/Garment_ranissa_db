/*
===============================================================================
003_sales_invoice.sql

Purpose:
    Sales Invoice Processing

Responsibilities
----------------
- Create Sales Invoice
- Add Invoice Lines
- Calculate Invoice Totals
- Create Customer Receivable
- Post Accounting Journal
- Update Delivery Status
- Close Sales Order (if completed)

===============================================================================
*/

-- ============================================================================
-- Create Sales Invoice
-- ============================================================================

CREATE OR REPLACE FUNCTION create_sales_invoice(

    p_company_id UUID,
    p_customer_id UUID,
    p_sales_order_id UUID,
    p_delivery_note_id UUID,
    p_invoice_number TEXT,
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

    v_invoice_id UUID;

BEGIN

    INSERT INTO sales_invoice(

        company_id,
        customer_id,
        sales_order_id,
        delivery_note_id,
        invoice_number,
        invoice_date,
        due_date,
        currency_code,
        exchange_rate,
        created_by

    )

    VALUES(

        p_company_id,
        p_customer_id,
        p_sales_order_id,
        p_delivery_note_id,
        p_invoice_number,
        p_invoice_date,
        p_due_date,
        p_currency_code,
        p_exchange_rate,
        p_user_id

    )

    RETURNING id
    INTO v_invoice_id;

    RETURN v_invoice_id;

END;

$$;

-- ============================================================================
-- Add Invoice Line
-- ============================================================================

CREATE OR REPLACE FUNCTION add_sales_invoice_line(

    p_sales_invoice_id UUID,
    p_sales_order_line_id UUID,
    p_item_id UUID,
    p_style_id UUID,
    p_color_id UUID,
    p_size_id UUID,
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

    v_line_amount :=
        p_quantity * p_unit_price;

    INSERT INTO sales_invoice_line(

        sales_invoice_id,
        sales_order_line_id,
        item_id,
        style_id,
        color_id,
        size_id,
        quantity,
        unit_price,
        discount_percent,
        tax_percent,
        line_amount

    )

    VALUES(

        p_sales_invoice_id,
        p_sales_order_line_id,
        p_item_id,
        p_style_id,
        p_color_id,
        p_size_id,
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
-- Calculate Invoice Totals
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_sales_invoice_total(

    p_sales_invoice_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE sales_invoice si

    SET

        subtotal = x.subtotal,

        tax_amount = x.tax_amount,

        total_amount = x.total_amount,

        balance_amount = x.total_amount - si.paid_amount,

        updated_at = NOW()

    FROM (

        SELECT

            sales_invoice_id,

            SUM(line_amount) AS subtotal,

            SUM(line_amount * tax_percent / 100) AS tax_amount,

            SUM(line_amount + (line_amount * tax_percent / 100))
                AS total_amount

        FROM sales_invoice_line

        WHERE sales_invoice_id = p_sales_invoice_id

        GROUP BY sales_invoice_id

    ) x

    WHERE si.id = x.sales_invoice_id;

END;

$$;

-- ============================================================================
-- Create Customer Receivable
-- ============================================================================

CREATE OR REPLACE FUNCTION create_customer_receivable(

    p_sales_invoice_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_receivable_id UUID;

BEGIN

    INSERT INTO customer_receivable(

        company_id,
        customer_id,
        sales_invoice_id,
        invoice_date,
        due_date,
        invoice_amount,
        outstanding_amount

    )

    SELECT

        company_id,
        customer_id,
        id,
        invoice_date,
        due_date,
        total_amount,
        balance_amount

    FROM sales_invoice

    WHERE id = p_sales_invoice_id

    RETURNING id
    INTO v_receivable_id;

    RETURN v_receivable_id;

END;

$$;

-- ============================================================================
-- Complete Invoice
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_sales_invoice(

    p_sales_invoice_id UUID,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_sales_order_id UUID;

BEGIN

    UPDATE sales_invoice

    SET

        status = 'POSTED',

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_sales_invoice_id;

    SELECT sales_order_id

    INTO v_sales_order_id

    FROM sales_invoice

    WHERE id = p_sales_invoice_id;

    PERFORM create_customer_receivable(
        p_sales_invoice_id
    );

    /*
        Future

        PERFORM create_journal(...);

        PERFORM post_journal(...);

        PERFORM update_customer_balance(...);

        PERFORM close_delivery_note(...);

        PERFORM close_sales_order(...);
    */

END;

$$;
