/*
===============================================================================
004_schedule_planning.sql

Purpose:
    Production Schedule Planning

===============================================================================
*/

-- ============================================================================
-- Generate Daily Schedule
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_daily_schedule(

    p_plan_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    INSERT INTO production_plan_schedule(

        production_plan_line_id,
        work_date,
        shift,
        planned_quantity,
        planned_minutes,
        production_line_id

    )

    SELECT

        ppl.id,

        ppl.planned_start_date,

        'SHIFT-1',

        ppl.planned_quantity,

        COALESCE(SUM(ppo.estimated_minutes),0),

        ppl.production_line_id

    FROM production_plan_line ppl

    LEFT JOIN production_plan_operation ppo

        ON ppo.production_plan_line_id = ppl.id

    WHERE ppl.production_plan_id = p_plan_id

    GROUP BY

        ppl.id,
        ppl.planned_start_date,
        ppl.planned_quantity,
        ppl.production_line_id;

END;

$$;

-- ============================================================================
-- Allocate Shift
-- ============================================================================

CREATE OR REPLACE FUNCTION allocate_shift(

    p_schedule_id UUID,

    p_shift TEXT

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_plan_schedule

    SET

        shift = p_shift

    WHERE id = p_schedule_id;

END;

$$;

-- ============================================================================
-- Reschedule Production
-- ============================================================================

CREATE OR REPLACE FUNCTION reschedule_production(

    p_schedule_id UUID,

    p_new_date DATE

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_plan_schedule

    SET

        work_date = p_new_date

    WHERE id = p_schedule_id;

END;

$$;

-- ============================================================================
-- Change Production Line
-- ============================================================================

CREATE OR REPLACE FUNCTION reassign_production_line(

    p_schedule_id UUID,

    p_line_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_plan_schedule

    SET

        production_line_id = p_line_id

    WHERE id = p_schedule_id;

END;

$$;

-- ============================================================================
-- Delay Schedule
-- ============================================================================

CREATE OR REPLACE FUNCTION delay_schedule(

    p_schedule_id UUID,

    p_days INTEGER

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_plan_schedule

    SET

        work_date = work_date + p_days

    WHERE id = p_schedule_id;

END;

$$;

-- ============================================================================
-- Complete Schedule
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_schedule(

    p_schedule_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_plan_schedule

    SET

        planned_quantity = planned_quantity

    WHERE id = p_schedule_id;

END;

$$;

-- ============================================================================
-- Get Schedule By Date
-- ============================================================================

CREATE OR REPLACE FUNCTION get_schedule_by_date(

    p_work_date DATE

)

RETURNS TABLE(

    schedule_id UUID,
    production_plan_line_id UUID,
    production_line_id UUID,
    planned_quantity NUMERIC,
    shift TEXT

)

LANGUAGE plpgsql

AS
$$

BEGIN

    RETURN QUERY

    SELECT

        pps.id,

        pps.production_plan_line_id,

        pps.production_line_id,

        pps.planned_quantity,

        pps.shift

    FROM production_plan_schedule pps

    WHERE pps.work_date = p_work_date;

END;

$$;

-- ============================================================================
-- Generate Weekly Schedule
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_weekly_schedule(

    p_plan_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    PERFORM generate_daily_schedule(

        p_plan_id

    );

END;

$$;

-- ============================================================================
-- Generate Monthly Schedule
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_monthly_schedule(

    p_plan_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    PERFORM generate_daily_schedule(

        p_plan_id

    );

END;

$$;
