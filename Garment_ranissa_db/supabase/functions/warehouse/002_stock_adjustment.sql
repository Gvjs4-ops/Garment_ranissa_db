/*
===============================================================================
002_stock_adjustment.sql

Purpose:
    Stock Adjustment Engine

Responsibilities
----------------
- Create Stock Adjustment
- Add Adjustment Line
- Validate Adjustment
- Execute Inventory Adjustment
- Complete Adjustment
- Cancel Adjustment

===============================================================================
*/

-- ============================================================================
-- Create Stock Adjustment
-- ============================================================================

CREATE OR REPLACE FUNCTION create_stock_adjustment(

    p_company_id UUID,
    p_adjustment_number TEXT,
    p_adjustment_date DATE,
    p_warehouse_id UUID,
    p_reason TEXT,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_adjustment_id UUID;

BEGIN

    INSERT INTO stock_adjustment(

        company_id,
        adjustment_number,
        adjustment_date,
        warehouse_id,
        reason,
        created_by

    )

    VALUES(

        p_company_id,
        p_adjustment_number,
        p_adjustment_date,
        p_warehouse_id,
        p_reason,
        p_user_id

    )

    RETURNING id
    INTO v_adjustment_id;

    RETURN v_adjustment_id;

END;

$$;

-- ============================================================================
-- Add Adjustment Line
-- ============================================================================

CREATE OR REPLACE FUNCTION add_stock_adjustment_line(

    p_adjustment_id UUID,
    p_item_id UUID,
    p_bin_id UUID,
    p_system_qty NUMERIC,
    p_physical_qty NUMERIC,
    p_remarks TEXT DEFAULT NULL

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_line_id UUID;

BEGIN

    INSERT INTO stock_adjustment_line(

        stock_adjustment_id,
        item_id,
        warehouse_bin_id,
        system_quantity,
        physical_quantity,
        adjustment_quantity,
        remarks

    )

    VALUES(

        p_adjustment_id,
        p_item_id,
        p_bin_id,
        p_system_qty,
        p_physical_qty,
        p_physical_qty - p_system_qty,
        p_remarks

    )

    RETURNING id
    INTO v_line_id;

    RETURN v_line_id;

END;

$$;

-- ============================================================================
-- Validate Adjustment
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_stock_adjustment(

    p_adjustment_id UUID

)

RETURNS BOOLEAN

LANGUAGE plpgsql

AS
$$

BEGIN

    /*
        Future

        Verify warehouse

        Verify bin

        Verify inventory period

        Verify authorization

        Verify adjustment limits

    */

    RETURN TRUE;

END;

$$;

-- ============================================================================
-- Execute Adjustment
-- ============================================================================

CREATE OR REPLACE FUNCTION execute_stock_adjustment(

    p_adjustment_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    /*
    ----------------------------------------------------------------------

    Future

    FOR every adjustment line

        Update inventory balance

        Update inventory ledger

        Update stock valuation

        Generate accounting journal

        Create audit record

    ----------------------------------------------------------------------
    */

END;

$$;

-- ============================================================================
-- Complete Adjustment
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_stock_adjustment(

    p_adjustment_id UUID,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    PERFORM validate_stock_adjustment(

        p_adjustment_id

    );

    PERFORM execute_stock_adjustment(

        p_adjustment_id

    );

    UPDATE stock_adjustment

    SET

        status = 'COMPLETED',

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_adjustment_id;

END;

$$;

-- ============================================================================
-- Cancel Adjustment
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_stock_adjustment(

    p_adjustment_id UUID,
    p_reason TEXT,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE stock_adjustment

    SET

        status = 'CANCELLED',

        reason = p_reason,

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_adjustment_id;

END;

$$;
