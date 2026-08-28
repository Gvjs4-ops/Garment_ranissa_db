/*
===============================================================================
002_delivery_management.sql

Purpose:
    Delivery Management

===============================================================================
*/

-- ============================================================================
-- Create Delivery Note
-- ============================================================================

CREATE OR REPLACE FUNCTION create_delivery_note(

    p_company_id UUID,
    p_sales_order_id UUID,
    p_delivery_number TEXT,
    p_delivery_date DATE,
    p_warehouse_id UUID,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_delivery_note_id UUID;

BEGIN

    INSERT INTO delivery_note(

        company_id,
        sales_order_id,
        delivery_number,
        delivery_date,
        warehouse_id,
        status,
        created_by

    )

    VALUES(

        p_company_id,
        p_sales_order_id,
        p_delivery_number,
        p_delivery_date,
        p_warehouse_id,
        'DRAFT',
        p_user_id

    )

    RETURNING id
    INTO v_delivery_note_id;

    RETURN v_delivery_note_id;

END;

$$;

-- ============================================================================
-- Add Delivery Line
-- ============================================================================

CREATE OR REPLACE FUNCTION add_delivery_line(

    p_delivery_note_id UUID,
    p_sales_order_line_id UUID,
    p_item_id UUID,
    p_quantity NUMERIC

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_line_id UUID;

BEGIN

    INSERT INTO delivery_note_line(

        delivery_note_id,
        sales_order_line_id,
        item_id,
        quantity

    )

    VALUES(

        p_delivery_note_id,
        p_sales_order_line_id,
        p_item_id,
        p_quantity

    )

    RETURNING id
    INTO v_line_id;

    RETURN v_line_id;

END;

$$;

-- ============================================================================
-- Allocate Inventory
-- ============================================================================

CREATE OR REPLACE FUNCTION allocate_delivery_inventory(

    p_delivery_note_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    /*
        Future:

        Reserve inventory
        Allocate batches
        Allocate serial numbers
    */

END;

$$;

-- ============================================================================
-- Confirm Delivery
-- ============================================================================

CREATE OR REPLACE FUNCTION confirm_delivery(

    p_delivery_note_id UUID,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE delivery_note

    SET

        status = 'DELIVERED',

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_delivery_note_id;

END;

$$;

-- ============================================================================
-- Update Delivered Quantity
-- ============================================================================

CREATE OR REPLACE FUNCTION update_sales_order_delivery(

    p_sales_order_line_id UUID,
    p_quantity NUMERIC

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE sales_order_line

    SET

        delivered_quantity =
            delivered_quantity + p_quantity,

        status = CASE

            WHEN delivered_quantity + p_quantity >= ordered_quantity

            THEN 'DELIVERED'

            ELSE 'PARTIAL'

        END

    WHERE id = p_sales_order_line_id;

END;

$$;

-- ============================================================================
-- Close Delivery Note
-- ============================================================================

CREATE OR REPLACE FUNCTION close_delivery_note(

    p_delivery_note_id UUID,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE delivery_note

    SET

        status = 'CLOSED',

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_delivery_note_id;

END;

$$;

-- ============================================================================
-- Cancel Delivery Note
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_delivery_note(

    p_delivery_note_id UUID,
    p_reason TEXT,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE delivery_note

    SET

        status = 'CANCELLED',

        remarks = p_reason,

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_delivery_note_id;

END;

$$;
