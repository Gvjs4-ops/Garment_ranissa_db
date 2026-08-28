/*
===============================================================================
001_purchase_order.sql

Purpose:
    Purchase Order Management

===============================================================================
*/

-- ============================================================================
-- Create Purchase Order
-- ============================================================================

CREATE OR REPLACE FUNCTION create_purchase_order(

    p_company_id UUID,
    p_supplier_id UUID,
    p_order_number TEXT,
    p_order_date DATE,
    p_expected_delivery_date DATE,
    p_currency_code TEXT,
    p_exchange_rate NUMERIC,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_purchase_order_id UUID;

BEGIN

    INSERT INTO purchase_order(

        company_id,
        supplier_id,
        order_number,
        order_date,
        expected_delivery_date,
        currency_code,
        exchange_rate,
        created_by

    )

    VALUES(

        p_company_id,
        p_supplier_id,
        p_order_number,
        p_order_date,
        p_expected_delivery_date,
        p_currency_code,
        p_exchange_rate,
        p_user_id

    )

    RETURNING id
    INTO v_purchase_order_id;

    RETURN v_purchase_order_id;

END;

$$;

-- ============================================================================
-- Add Purchase Order Line
-- ============================================================================

CREATE OR REPLACE FUNCTION add_purchase_order_line(

    p_purchase_order_id UUID,
    p_line_no INTEGER,
    p_item_id UUID,
    p_quantity NUMERIC,
    p_unit_price NUMERIC,
    p_discount_percent NUMERIC,
    p_tax_percent NUMERIC,
    p_warehouse_id UUID

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

    INSERT INTO purchase_order_line(

        purchase_order_id,
        line_no,
        item_id,
        ordered_quantity,
        unit_price,
        discount_percent,
        tax_percent,
        line_amount,
        warehouse_id

    )

    VALUES(

        p_purchase_order_id,
        p_line_no,
        p_item_id,
        p_quantity,
        p_unit_price,
        p_discount_percent,
        p_tax_percent,
        v_line_amount,
        p_warehouse_id

    )

    RETURNING id
    INTO v_line_id;

    PERFORM calculate_purchase_order_total(
        p_purchase_order_id
    );

    RETURN v_line_id;

END;

$$;

-- ============================================================================
-- Calculate Purchase Order Total
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_purchase_order_total(

    p_purchase_order_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE purchase_order po

    SET

        subtotal = x.subtotal,

        tax_amount = x.tax_amount,

        total_amount = x.total_amount,

        updated_at = NOW()

    FROM (

        SELECT

            purchase_order_id,

            SUM(line_amount) AS subtotal,

            SUM(line_amount * tax_percent / 100) AS tax_amount,

            SUM(
                line_amount +
                (line_amount * tax_percent / 100)
            ) AS total_amount

        FROM purchase_order_line

        WHERE purchase_order_id = p_purchase_order_id

        GROUP BY purchase_order_id

    ) x

    WHERE po.id = x.purchase_order_id;

END;

$$;

-- ============================================================================
-- Approve Purchase Order
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_purchase_order(

    p_purchase_order_id UUID,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE purchase_order

    SET

        status = 'APPROVED',

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_purchase_order_id;

END;

$$;

-- ============================================================================
-- Close Purchase Order
-- ============================================================================

CREATE OR REPLACE FUNCTION close_purchase_order(

    p_purchase_order_id UUID,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE purchase_order

    SET

        status = 'CLOSED',

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_purchase_order_id;

END;

$$;

-- ============================================================================
-- Cancel Purchase Order
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_purchase_order(

    p_purchase_order_id UUID,
    p_reason TEXT,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE purchase_order

    SET

        status = 'CANCELLED',

        remarks = p_reason,

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_purchase_order_id;

END;

$$;

-- ============================================================================
-- Validate Supplier
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_supplier(

    p_supplier_id UUID

)

RETURNS BOOLEAN

LANGUAGE plpgsql

AS
$$

BEGIN

    RETURN EXISTS (

        SELECT 1

        FROM business_partner

        WHERE id = p_supplier_id

          AND partner_type = 'SUPPLIER'

          AND is_active = TRUE

    );

END;

$$;
