/*
===============================================================================
003_breakdown_management.sql

Purpose
-------
Machine Breakdown Management

Responsibilities

- Report Breakdown
- Assign Technician
- Create Work Order
- Start Repair
- Complete Repair
- Close Breakdown

===============================================================================
*/

-- ============================================================================
-- Report Breakdown
-- ============================================================================

CREATE OR REPLACE FUNCTION report_breakdown(

    p_asset_id UUID,
    p_breakdown_number TEXT,
    p_reported_by UUID,
    p_description TEXT,
    p_severity TEXT

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_breakdown_id UUID;

BEGIN

    INSERT INTO maintenance_breakdown(

        asset_id,
        breakdown_number,
        breakdown_date,
        reported_by,
        description,
        severity,
        status

    )

    VALUES(

        p_asset_id,
        p_breakdown_number,
        NOW(),
        p_reported_by,
        p_description,
        COALESCE(p_severity,'MEDIUM'),
        'OPEN'

    )

    RETURNING id
    INTO v_breakdown_id;

    UPDATE maintenance_asset

    SET

        status = 'BREAKDOWN',

        updated_at = NOW()

    WHERE id = p_asset_id;

    RETURN v_breakdown_id;

END;

$$;

-- ============================================================================
-- Assign Technician
-- ============================================================================

CREATE OR REPLACE FUNCTION assign_breakdown(

    p_breakdown_id UUID,
    p_technician_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE maintenance_breakdown

    SET

        status = 'ASSIGNED'

    WHERE id = p_breakdown_id;

END;

$$;

-- ============================================================================
-- Start Repair
-- ============================================================================

CREATE OR REPLACE FUNCTION start_repair(

    p_work_order_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE maintenance_work_order

    SET

        status = 'IN_PROGRESS',

        start_time = NOW(),

        updated_at = NOW()

    WHERE id = p_work_order_id;

END;

$$;

-- ============================================================================
-- Complete Repair
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_repair(

    p_work_order_id UUID,
    p_asset_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE maintenance_work_order

    SET

        status = 'COMPLETED',

        end_time = NOW(),

        updated_at = NOW()

    WHERE id = p_work_order_id;

    UPDATE maintenance_asset

    SET

        status = 'ACTIVE',

        updated_at = NOW()

    WHERE id = p_asset_id;

END;

$$;

-- ============================================================================
-- Close Breakdown
-- ============================================================================

CREATE OR REPLACE FUNCTION close_breakdown(

    p_breakdown_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE maintenance_breakdown

    SET

        status = 'CLOSED'

    WHERE id = p_breakdown_id;

END;

$$;
