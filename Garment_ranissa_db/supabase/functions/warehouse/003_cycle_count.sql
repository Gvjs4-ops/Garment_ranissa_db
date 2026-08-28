/*
===============================================================================
003_cycle_count.sql

Purpose:
    Cycle Count Management

Responsibilities
----------------
- Create Cycle Count
- Generate Count Sheet
- Record Physical Count
- Calculate Variance
- Complete Cycle Count
- Cancel Cycle Count

===============================================================================
*/

-- ============================================================================
-- Create Cycle Count
-- ============================================================================

CREATE OR REPLACE FUNCTION create_cycle_count(

    p_company_id UUID,
    p_warehouse_id UUID,
    p_count_number TEXT,
    p_count_date DATE,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_cycle_count_id UUID;

BEGIN

    INSERT INTO cycle_count(

        company_id,
        warehouse_id,
        count_number,
        count_date,
        created_by

    )

    VALUES(

        p_company_id,
        p_warehouse_id,
        p_count_number,
        p_count_date,
        p_user_id

    )

    RETURNING id
    INTO v_cycle_count_id;

    RETURN v_cycle_count_id;

END;

$$;

-- ============================================================================
-- Generate Count Sheet
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_cycle_count_sheet(

    p_cycle_count_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    /*
    Future

    Populate cycle_count_line from inventory.

    Include:

        Warehouse Bin
        Item
        Lot
        Batch
        Serial Number
        System Quantity

    */

END;

$$;

-- ============================================================================
-- Record Physical Count
-- ============================================================================

CREATE OR REPLACE FUNCTION record_cycle_count(

    p_cycle_count_line_id UUID,
    p_physical_quantity NUMERIC

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE cycle_count_line

    SET

        physical_quantity = p_physical_quantity,

        variance_quantity =

            p_physical_quantity

            -

            system_quantity,

        counted_at = NOW()

    WHERE id = p_cycle_count_line_id;

END;

$$;

-- ============================================================================
-- Calculate Variance
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_cycle_count_variance(

    p_cycle_count_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE cycle_count_line

    SET

        variance_quantity =

            physical_quantity

            -

            system_quantity

    WHERE cycle_count_id = p_cycle_count_id;

END;

$$;

-- ============================================================================
-- Generate Stock Adjustment
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_cycle_count_adjustment(

    p_cycle_count_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    /*
    Future

    Create Stock Adjustment

    Transfer all variances

    into stock_adjustment

    */

END;

$$;

-- ============================================================================
-- Complete Cycle Count
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_cycle_count(

    p_cycle_count_id UUID,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    PERFORM calculate_cycle_count_variance(

        p_cycle_count_id

    );

    PERFORM generate_cycle_count_adjustment(

        p_cycle_count_id

    );

    UPDATE cycle_count

    SET

        status = 'COMPLETED',

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_cycle_count_id;

END;

$$;

-- ============================================================================
-- Cancel Cycle Count
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_cycle_count(

    p_cycle_count_id UUID,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE cycle_count

    SET

        status = 'CANCELLED',

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_cycle_count_id;

END;

$$;
