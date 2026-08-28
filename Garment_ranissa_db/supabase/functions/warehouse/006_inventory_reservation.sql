/*
===============================================================================
006_inventory_reservation.sql

Purpose:
    Inventory Reservation Engine

Responsibilities
----------------
- Create Reservation
- Reserve Inventory
- Release Reservation
- Consume Reservation
- Cancel Reservation

===============================================================================
*/

-- ============================================================================
-- Create Reservation
-- ============================================================================

CREATE OR REPLACE FUNCTION create_inventory_reservation(

    p_company_id UUID,
    p_sales_order_id UUID,
    p_item_id UUID,
    p_warehouse_id UUID,
    p_quantity NUMERIC,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_reservation_id UUID;

BEGIN

    INSERT INTO inventory_reservation(

        company_id,
        sales_order_id,
        item_id,
        warehouse_id,
        reserved_quantity,
        consumed_quantity,
        status,
        created_by

    )

    VALUES(

        p_company_id,
        p_sales_order_id,
        p_item_id,
        p_warehouse_id,
        p_quantity,
        0,
        'RESERVED',
        p_user_id

    )

    RETURNING id
    INTO v_reservation_id;

    RETURN v_reservation_id;

END;

$$;

-- ============================================================================
-- Validate Reservation
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_inventory_reservation(

    p_item_id UUID,
    p_warehouse_id UUID,
    p_quantity NUMERIC

)

RETURNS BOOLEAN

LANGUAGE plpgsql

AS
$$

BEGIN

    /*
        Future

        Available Stock

        -

        Existing Reservations

        >= Requested Quantity

    */

    RETURN TRUE;

END;

$$;

-- ============================================================================
-- Consume Reservation
-- ============================================================================

CREATE OR REPLACE FUNCTION consume_inventory_reservation(

    p_reservation_id UUID,
    p_quantity NUMERIC

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE inventory_reservation

    SET

        consumed_quantity =
            consumed_quantity + p_quantity,

        status = CASE

            WHEN consumed_quantity + p_quantity >= reserved_quantity

            THEN 'CONSUMED'

            ELSE 'PARTIAL'

        END,

        updated_at = NOW()

    WHERE id = p_reservation_id;

END;

$$;

-- ============================================================================
-- Release Reservation
-- ============================================================================

CREATE OR REPLACE FUNCTION release_inventory_reservation(

    p_reservation_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE inventory_reservation

    SET

        status = 'RELEASED',

        updated_at = NOW()

    WHERE id = p_reservation_id;

END;

$$;

-- ============================================================================
-- Cancel Reservation
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_inventory_reservation(

    p_reservation_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE inventory_reservation

    SET

        status = 'CANCELLED',

        updated_at = NOW()

    WHERE id = p_reservation_id;

END;

$$;
