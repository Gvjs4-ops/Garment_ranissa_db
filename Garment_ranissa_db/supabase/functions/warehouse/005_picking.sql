/*
===============================================================================
005_picking.sql

Purpose:
    Warehouse Picking Engine

Responsibilities
----------------
- Create Picking Task
- Add Picking Line
- Allocate Inventory
- Pick Items
- Complete Picking
- Cancel Picking

===============================================================================
*/

-- ============================================================================
-- Create Picking Task
-- ============================================================================

CREATE OR REPLACE FUNCTION create_pick_task(

    p_company_id UUID,
    p_pick_number TEXT,
    p_warehouse_id UUID,
    p_sales_order_id UUID,
    p_delivery_note_id UUID,
    p_priority INTEGER,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_pick_task_id UUID;

BEGIN

    INSERT INTO warehouse_pick_task(

        company_id,
        pick_number,
        warehouse_id,
        sales_order_id,
        delivery_note_id,
        priority,
        status,
        created_by

    )

    VALUES(

        p_company_id,
        p_pick_number,
        p_warehouse_id,
        p_sales_order_id,
        p_delivery_note_id,
        COALESCE(p_priority,5),
        'OPEN',
        p_user_id

    )

    RETURNING id
    INTO v_pick_task_id;

    RETURN v_pick_task_id;

END;

$$;

-- ============================================================================
-- Add Picking Line
-- ============================================================================

CREATE OR REPLACE FUNCTION add_pick_task_line(

    p_pick_task_id UUID,
    p_item_id UUID,
    p_bin_id UUID,
    p_required_quantity NUMERIC

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_line_id UUID;

BEGIN

    INSERT INTO warehouse_pick_task_line(

        warehouse_pick_task_id,
        item_id,
        warehouse_bin_id,
        required_quantity

    )

    VALUES(

        p_pick_task_id,
        p_item_id,
        p_bin_id,
        p_required_quantity

    )

    RETURNING id
    INTO v_line_id;

    RETURN v_line_id;

END;

$$;

-- ============================================================================
-- Allocate Inventory
-- ============================================================================

CREATE OR REPLACE FUNCTION allocate_pick_inventory(

    p_pick_task_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    /*
    Future

        • FEFO allocation
        • FIFO allocation
        • Lot allocation
        • Batch allocation
        • Serial allocation
        • Bin optimization

    */

END;

$$;

-- ============================================================================
-- Pick Item
-- ============================================================================

CREATE OR REPLACE FUNCTION pick_inventory(

    p_pick_line_id UUID,
    p_quantity NUMERIC

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE warehouse_pick_task_line

    SET

        picked_quantity =

            picked_quantity + p_quantity,

        status = CASE

            WHEN picked_quantity + p_quantity >= required_quantity

            THEN 'COMPLETED'

            ELSE 'PARTIAL'

        END

    WHERE id = p_pick_line_id;

END;

$$;

-- ============================================================================
-- Complete Picking
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_pick_task(

    p_pick_task_id UUID,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE warehouse_pick_task

    SET

        status='COMPLETED',

        completed_by=p_user_id,

        completed_at=NOW(),

        updated_at=NOW()

    WHERE id=p_pick_task_id;

END;

$$;

-- ============================================================================
-- Cancel Picking
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_pick_task(

    p_pick_task_id UUID,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE warehouse_pick_task

    SET

        status='CANCELLED',

        completed_by=p_user_id,

        completed_at=NOW(),

        updated_at=NOW()

    WHERE id=p_pick_task_id;

END;

$$;
