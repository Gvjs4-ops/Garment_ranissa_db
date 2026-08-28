/*
===============================================================================
004_putaway.sql

Purpose:
    Warehouse Put-away Engine

Responsibilities
----------------
- Create Put-away Task
- Assign Destination Bin
- Validate Bin Capacity
- Execute Put-away
- Complete Put-away

===============================================================================
*/

-- ============================================================================
-- Create Put-away Task
-- ============================================================================

CREATE OR REPLACE FUNCTION create_putaway_task(

    p_receipt_id UUID,
    p_item_id UUID,
    p_quantity NUMERIC,
    p_source_bin_id UUID,
    p_destination_bin_id UUID,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_task_id UUID;

BEGIN

    INSERT INTO warehouse_putaway(

        receipt_id,
        item_id,
        quantity,
        source_bin_id,
        destination_bin_id,
        status,
        created_by

    )

    VALUES(

        p_receipt_id,
        p_item_id,
        p_quantity,
        p_source_bin_id,
        p_destination_bin_id,
        'OPEN',
        p_user_id

    )

    RETURNING id
    INTO v_task_id;

    RETURN v_task_id;

END;

$$;

-- ============================================================================
-- Validate Bin Capacity
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_putaway_bin(

    p_destination_bin_id UUID,
    p_quantity NUMERIC

)

RETURNS BOOLEAN

LANGUAGE plpgsql

AS
$$

BEGIN

    /*
        Future

        Check:

        - Bin capacity
        - Bin status
        - Item compatibility
        - Hazard restrictions
        - Weight limits
    */

    RETURN TRUE;

END;

$$;

-- ============================================================================
-- Execute Put-away
-- ============================================================================

CREATE OR REPLACE FUNCTION execute_putaway(

    p_task_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    /*
        Future

        - Move inventory
        - Update warehouse bin stock
        - Update inventory ledger
        - Create audit log
    */

END;

$$;

-- ============================================================================
-- Complete Put-away
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_putaway(

    p_task_id UUID,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    PERFORM execute_putaway(

        p_task_id

    );

    UPDATE warehouse_putaway

    SET

        status = 'COMPLETED',

        completed_by = p_user_id,

        completed_at = NOW()

    WHERE id = p_task_id;

END;

$$;

-- ============================================================================
-- Cancel Put-away
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_putaway(

    p_task_id UUID,
    p_reason TEXT,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE warehouse_putaway

    SET

        status = 'CANCELLED',

        remarks = p_reason,

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_task_id;

END;

$$;
