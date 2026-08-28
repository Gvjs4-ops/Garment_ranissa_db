/*
===============================================================================
004_shopfloor_execution.sql

Purpose:
    Shop Floor Execution Functions

Responsibilities
----------------
- Assign bundle to operator
- Start work
- Pause work
- Resume work
- Complete work
- Reassign bundle
- Record machine downtime

===============================================================================
*/

-- ============================================================================
-- Assign Bundle
-- ============================================================================

CREATE OR REPLACE FUNCTION assign_bundle(

    p_bundle_id UUID,
    p_operator_id UUID,
    p_machine_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_bundle

    SET

        current_operator_id = p_operator_id,

        current_machine_id = p_machine_id,

        assigned_at = NOW(),

        updated_at = NOW()

    WHERE id = p_bundle_id;

END;

$$;

-- ============================================================================
-- Start Work
-- ============================================================================

CREATE OR REPLACE FUNCTION start_work(

    p_bundle_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_bundle

    SET

        work_status = 'IN_PROGRESS',

        work_started_at = NOW(),

        updated_at = NOW()

    WHERE id = p_bundle_id;

END;

$$;

-- ============================================================================
-- Pause Work
-- ============================================================================

CREATE OR REPLACE FUNCTION pause_work(

    p_bundle_id UUID,

    p_reason TEXT

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_bundle

    SET

        work_status = 'PAUSED',

        pause_reason = p_reason,

        paused_at = NOW(),

        updated_at = NOW()

    WHERE id = p_bundle_id;

END;

$$;

-- ============================================================================
-- Resume Work
-- ============================================================================

CREATE OR REPLACE FUNCTION resume_work(

    p_bundle_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_bundle

    SET

        work_status = 'IN_PROGRESS',

        resumed_at = NOW(),

        updated_at = NOW()

    WHERE id = p_bundle_id;

END;

$$;

-- ============================================================================
-- Complete Work
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_work(

    p_bundle_id UUID,

    p_good_qty NUMERIC,

    p_reject_qty NUMERIC

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_bundle

    SET

        work_status = 'COMPLETED',

        good_quantity = p_good_qty,

        reject_quantity = p_reject_qty,

        completed_at = NOW(),

        updated_at = NOW()

    WHERE id = p_bundle_id;

END;

$$;

-- ============================================================================
-- Reassign Bundle
-- ============================================================================

CREATE OR REPLACE FUNCTION reassign_bundle(

    p_bundle_id UUID,

    p_new_operator UUID,

    p_new_machine UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_bundle

    SET

        current_operator_id = p_new_operator,

        current_machine_id = p_new_machine,

        assigned_at = NOW(),

        updated_at = NOW()

    WHERE id = p_bundle_id;

END;

$$;

-- ============================================================================
-- Record Machine Downtime
-- ============================================================================

CREATE OR REPLACE FUNCTION record_machine_downtime(

    p_machine_id UUID,

    p_bundle_id UUID,

    p_reason TEXT,

    p_start_time TIMESTAMPTZ,

    p_end_time TIMESTAMPTZ

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    INSERT INTO machine_downtime(

        machine_id,

        bundle_id,

        reason,

        downtime_start,

        downtime_end,

        duration_minutes,

        created_at

    )

    VALUES(

        p_machine_id,

        p_bundle_id,

        p_reason,

        p_start_time,

        p_end_time,

        EXTRACT(EPOCH FROM (p_end_time - p_start_time))/60,

        NOW()

    );

END;

$$;

-- ============================================================================
-- Get Active Bundle
-- ============================================================================

CREATE OR REPLACE FUNCTION get_operator_active_bundle(

    p_operator_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_bundle UUID;

BEGIN

    SELECT id

    INTO v_bundle

    FROM production_bundle

    WHERE current_operator_id = p_operator_id

      AND work_status = 'IN_PROGRESS'

    LIMIT 1;

    RETURN v_bundle;

END;

$$;
