/*
===============================================================================
001_sales_order.sql

Purpose:
    Sales Order Management

===============================================================================
*/

-- ============================================================================
-- Create Sales Order
-- ============================================================================

CREATE OR REPLACE FUNCTION create_sales_order(

    p_company_id UUID,
    p_customer_id UUID,
    p_order_number TEXT,
    p_order_date DATE,
    p_required_date DATE,
    p_currency_code TEXT,
    p_exchange_rate NUMERIC,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_sales_order_id UUID;

BEGIN

    INSERT INTO sales_order(

        company_id,
        customer_id,
        order_number,
        order_date,
        required_date,
        currency_code,
        exchange_rate,
        created_by

    )

    VALUES(

        p_company_id,
        p_customer_id,
        p_order_number,
        p_order_date,
        p_required_date,
        p_currency_code,
        p_exchange_rate,
        p_user_id

    )

    RETURNING id
    INTO v_sales_order_id;

    RETURN v_sales_order_id;

END;

$$;

-- ============================================================================
-- Add Sales Order Line
-- ============================================================================

CREATE OR REPLACE FUNCTION add_sales_order_line(

    p_sales_order_id UUID,
    p_line_no INTEGER,
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

    INSERT INTO sales_order_line(

        sales_order_id,
        line_no,
        item_id,
        style_id,
        color_id,
        size_id,
        ordered_quantity,
        unit_price,
        discount_percent,
        tax_percent,
        line_amount

    )

    VALUES(

        p_sales_order_id,
        p_line_no,
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

    PERFORM calculate_sales_order_total(
        p_sales_order_id
    );

    RETURN v_line_id;

END;

$$;

-- ============================================================================
-- Calculate Sales Order Total
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_sales_order_total(

    p_sales_order_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE sales_order

    SET

        total_quantity = x.total_qty,

        subtotal = x.subtotal,

        tax_amount = x.tax,

        total_amount = x.total,

        updated_at = NOW()

    FROM (

        SELECT

            sales_order_id,

            SUM(ordered_quantity) total_qty,

            SUM(line_amount) subtotal,

            SUM(line_amount * tax_percent / 100) tax,

            SUM(
                line_amount +
                (line_amount * tax_percent / 100)
            ) total

        FROM sales_order_line

        WHERE sales_order_id = p_sales_order_id

        GROUP BY sales_order_id

    ) x

    WHERE sales_order.id = x.sales_order_id;

END;

$$;

-- ============================================================================
-- Approve Sales Order
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_sales_order(

    p_sales_order_id UUID,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE sales_order

    SET

        status = 'APPROVED',

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_sales_order_id;

END;

$$;

-- ============================================================================
-- Cancel Sales Order
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_sales_order(

    p_sales_order_id UUID,
    p_reason TEXT,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE sales_order

    SET

        status = 'CANCELLED',

        remarks = p_reason,

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_sales_order_id;

END;

$$;

-- ============================================================================
-- Close Sales Order
-- ============================================================================

CREATE OR REPLACE FUNCTION close_sales_order(

    p_sales_order_id UUID,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE sales_order

    SET

        status = 'CLOSED',

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_sales_order_id;

END;

$$;

-- ============================================================================
-- Validate Customer Credit
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_customer_credit(

    p_customer_id UUID,
    p_order_amount NUMERIC

)

RETURNS BOOLEAN

LANGUAGE plpgsql

AS
$$

DECLARE

    v_credit_limit NUMERIC := 0;
    v_outstanding NUMERIC := 0;

BEGIN

    /*
        TODO

        Fetch customer's credit limit
        Fetch current outstanding balance

        Return FALSE if exceeded.
    */

    RETURN TRUE;

END;

$$;
