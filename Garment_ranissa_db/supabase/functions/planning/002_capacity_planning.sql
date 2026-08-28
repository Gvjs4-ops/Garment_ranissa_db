/*
===============================================================================
002_capacity_planning.sql

Purpose:
    Capacity Planning Functions

===============================================================================
*/

-- ============================================================================
-- Check Production Line Capacity
-- ============================================================================

CREATE OR REPLACE FUNCTION check_production_line_capacity(

    p_production_line_id UUID,
    p_work_date DATE,
    p_required_minutes NUMERIC

)

RETURNS BOOLEAN

LANGUAGE plpgsql

AS
$$

DECLARE

    v_available NUMERIC := 0;
    v_allocated NUMERIC := 0;

BEGIN

    SELECT
        COALESCE(SUM(available_minutes),0),
        COALESCE(SUM(allocated_minutes),0)
    INTO
        v_available,
        v_allocated
    FROM production_plan_capacity
    WHERE production_line_id = p_production_line_id
      AND DATE(created_at) = p_work_date;

    RETURN (v_available - v_allocated) >= p_required_minutes;

END;

$$;

-- ============================================================================
-- Allocate Capacity
-- ============================================================================

CREATE OR REPLACE FUNCTION allocate_capacity(

    p_plan_line_id UUID,
    p_production_line_id UUID,
    p_machine_id UUID,
    p_operator_id UUID,
    p_available_minutes NUMERIC,
    p_allocated_minutes NUMERIC

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_capacity_id UUID;

BEGIN

    INSERT INTO production_plan_capacity(

        production_plan_line_id,
        production_line_id,
        machine_id,
        operator_id,
        available_minutes,
        allocated_minutes,
        utilization_percent

    )

    VALUES(

        p_plan_line_id,
        p_production_line_id,
        p_machine_id,
        p_operator_id,
        p_available_minutes,
        p_allocated_minutes,

        CASE
            WHEN p_available_minutes = 0 THEN 0
            ELSE ROUND(
                (p_allocated_minutes / p_available_minutes) * 100,
                2
            )
        END

    )

    RETURNING id
    INTO v_capacity_id;

    RETURN v_capacity_id;

END;

$$;

-- ============================================================================
-- Update Capacity Allocation
-- ============================================================================

CREATE OR REPLACE FUNCTION update_capacity(

    p_capacity_id UUID,
    p_allocated_minutes NUMERIC

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_plan_capacity

    SET

        allocated_minutes = p_allocated_minutes,

        utilization_percent = CASE
            WHEN available_minutes = 0 THEN 0
            ELSE ROUND(
                (p_allocated_minutes / available_minutes) * 100,
                2
            )
        END

    WHERE id = p_capacity_id;

END;

$$;

-- ============================================================================
-- Release Capacity
-- ============================================================================

CREATE OR REPLACE FUNCTION release_capacity(

    p_capacity_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    DELETE FROM production_plan_capacity

    WHERE id = p_capacity_id;

END;

$$;

-- ============================================================================
-- Calculate Line Utilization
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_line_utilization(

    p_production_line_id UUID

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_available NUMERIC;
    v_allocated NUMERIC;

BEGIN

    SELECT

        COALESCE(SUM(available_minutes),0),

        COALESCE(SUM(allocated_minutes),0)

    INTO

        v_available,

        v_allocated

    FROM production_plan_capacity

    WHERE production_line_id = p_production_line_id;

    IF v_available = 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND(

        (v_allocated / v_available) * 100,

        2

    );

END;

$$;

-- ============================================================================
-- Find Capacity Conflicts
-- ============================================================================

CREATE OR REPLACE FUNCTION find_capacity_conflicts(

    p_production_line_id UUID

)

RETURNS TABLE(

    capacity_id UUID,
    utilization_percent NUMERIC

)

LANGUAGE plpgsql

AS
$$

BEGIN

    RETURN QUERY

    SELECT

        id,

        utilization_percent

    FROM production_plan_capacity

    WHERE production_line_id = p_production_line_id
      AND utilization_percent > 100;

END;

$$;
