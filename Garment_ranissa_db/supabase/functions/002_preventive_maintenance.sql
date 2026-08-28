/*
===============================================================================
002_preventive_maintenance.sql

Purpose
-------
Preventive Maintenance Engine

Responsibilities

- Create Maintenance Schedule
- Generate Work Orders
- Calculate Next Due Date
- Complete Preventive Maintenance
- Cancel Schedule

===============================================================================
*/

-- ============================================================================
-- Create Maintenance Schedule
-- ============================================================================

CREATE OR REPLACE FUNCTION create_maintenance_schedule(

    p_asset_id UUID,
    p_schedule_code TEXT,
    p_maintenance_type TEXT,
    p_frequency TEXT,
    p_next_due_date DATE,
    p_estimated_duration INTEGER,
    p_priority TEXT

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_schedule_id UUID;

BEGIN

    INSERT INTO maintenance_schedule(

        asset_id,
        schedule_code,
        maintenance_type,
        frequency,
        next_due_date,
        estimated_duration,
        priority

    )

    VALUES(

        p_asset_id,
        p_schedule_code,
        p_maintenance_type,
        UPPER(p_frequency),
        p_next_due_date,
        p_estimated_duration,
        COALESCE(p_priority,'MEDIUM')

    )

    RETURNING id
    INTO v_schedule_id;

    RETURN v_schedule_id;

END;

$$;

-- ============================================================================
-- Generate Preventive Maintenance Work Order
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_preventive_work_order(

    p_schedule_id UUID,
    p_company_id UUID,
    p_work_order_number TEXT,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_work_order_id UUID;

BEGIN

    INSERT INTO maintenance_work_order(

        company_id,
        work_order_number,
        asset_id,
        maintenance_type,
        scheduled_date,
        status,
        created_by

    )

    SELECT

        p_company_id,
        p_work_order_number,
        asset_id,
        maintenance_type,
        next_due_date,
        'OPEN',
        p_user_id

    FROM maintenance_schedule

    WHERE id = p_schedule_id

    RETURNING id
    INTO v_work_order_id;

    RETURN v_work_order_id;

END;

$$;

-- ============================================================================
-- Calculate Next Due Date
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_next_due_date(

    p_schedule_id UUID

)

RETURNS DATE

LANGUAGE plpgsql

AS
$$

DECLARE

    v_frequency TEXT;

    v_due_date DATE;

BEGIN

    SELECT

        frequency,
        next_due_date

    INTO

        v_frequency,
        v_due_date

    FROM maintenance_schedule

    WHERE id = p_schedule_id;

    CASE v_frequency

        WHEN 'DAILY' THEN
            v_due_date := v_due_date + INTERVAL '1 day';

        WHEN 'WEEKLY' THEN
            v_due_date := v_due_date + INTERVAL '7 day';

        WHEN 'MONTHLY' THEN
            v_due_date := v_due_date + INTERVAL '1 month';

        WHEN 'QUARTERLY' THEN
            v_due_date := v_due_date + INTERVAL '3 month';

        WHEN 'HALF_YEARLY' THEN
            v_due_date := v_due_date + INTERVAL '6 month';

        WHEN 'YEARLY' THEN
            v_due_date := v_due_date + INTERVAL '1 year';

    END CASE;

    UPDATE maintenance_schedule

    SET

        next_due_date = v_due_date,

        updated_at = NOW()

    WHERE id = p_schedule_id;

    RETURN v_due_date;

END;

$$;

-- ============================================================================
-- Complete Preventive Maintenance
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_preventive_maintenance(

    p_schedule_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    PERFORM calculate_next_due_date(

        p_schedule_id

    );

END;

$$;

-- ============================================================================
-- Cancel Maintenance Schedule
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_maintenance_schedule(

    p_schedule_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE maintenance_schedule

    SET

        is_active = FALSE,

        updated_at = NOW()

    WHERE id = p_schedule_id;

END;

$$;
