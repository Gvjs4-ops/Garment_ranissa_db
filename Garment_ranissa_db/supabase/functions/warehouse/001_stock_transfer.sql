/*
===============================================================================
001_stock_transfer.sql

Purpose:
    Warehouse Stock Transfer Engine

Responsibilities
----------------
- Create Stock Transfer
- Add Transfer Lines
- Validate Stock Availability
- Execute Inventory Transfer
- Complete Stock Transfer

===============================================================================
*/

-- ============================================================================
-- Create Stock Transfer
-- ============================================================================

CREATE OR REPLACE FUNCTION create_stock_transfer(

    p_company_id UUID,
    p_transfer_number TEXT,
    p_transfer_date DATE,
    p_from_warehouse_id UUID,
    p_to_warehouse_id UUID,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_transfer_id UUID;

BEGIN

    INSERT INTO stock_transfer(

        company_id,
        transfer_number,
        transfer_date,
        from_warehouse_id,
        to_warehouse_id,
        created_by

    )

    VALUES(

        p_company_id,
        p_transfer_number,
        p_transfer_date,
        p_from_warehouse_id,
        p_to_warehouse_id,
        p_user_id

    )

    RETURNING id
    INTO v_transfer_id;

    RETURN v_transfer_id;

END;

$$;

-- ============================================================================
-- Add Transfer Line
-- ============================================================================

CREATE OR REPLACE FUNCTION add_stock_transfer_line(

    p_transfer_id UUID,
    p_item_id UUID,
    p_from_bin_id UUID,
    p_to_bin_id UUID,
    p_quantity NUMERIC,
    p_remarks TEXT DEFAULT NULL

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_line_id UUID;

BEGIN

    INSERT INTO stock_transfer_line(

        stock_transfer_id,
        item_id,
        from_bin_id,
        to_bin_id,
        quantity,
        remarks

    )

    VALUES(

        p_transfer_id,
        p_item_id,
        p_from_bin_id,
        p_to_bin_id,
        p_quantity,
        p_remarks

    )

    RETURNING id
    INTO v_line_id;

    RETURN v_line_id;

END;

$$;

-- ============================================================================
-- Validate Transfer
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_stock_transfer(

    p_transfer_id UUID

)

RETURNS BOOLEAN

LANGUAGE plpgsql

AS
$$

BEGIN

    /*
        Future Validation

        • Check source warehouse

        • Check destination warehouse

        • Check available inventory

        • Check locked stock

        • Check reserved stock

        • Check bin permissions

    */

    RETURN TRUE;

END;

$$;

-- ============================================================================
-- Execute Transfer
-- ============================================================================

CREATE OR REPLACE FUNCTION execute_stock_transfer(

    p_transfer_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    /*
    -----------------------------------------------------------------------

    Future

    FOR each transfer line

        inventory OUT
            source warehouse

        inventory IN
            destination warehouse

        update inventory ledger

        update stock ledger

        update valuation

        audit log

    -----------------------------------------------------------------------
    */

END;

$$;

-- ============================================================================
-- Complete Transfer
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_stock_transfer(

    p_transfer_id UUID,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    PERFORM validate_stock_transfer(

        p_transfer_id

    );

    PERFORM execute_stock_transfer(

        p_transfer_id

    );

    UPDATE stock_transfer

    SET

        status='COMPLETED',

        updated_by=p_user_id,

        updated_at=NOW()

    WHERE id=p_transfer_id;

END;

$$;

-- ============================================================================
-- Cancel Transfer
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_stock_transfer(

    p_transfer_id UUID,
    p_reason TEXT,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE stock_transfer

    SET

        status='CANCELLED',

        remarks=p_reason,

        updated_by=p_user_id,

        updated_at=NOW()

    WHERE id=p_transfer_id;

END;

$$;
