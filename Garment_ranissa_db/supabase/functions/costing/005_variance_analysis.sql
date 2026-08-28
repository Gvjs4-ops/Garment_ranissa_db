/*
===============================================================================
005_variance_analysis.sql

Purpose:
    Production Cost Variance Analysis

Calculates the variance between the Planned (BOM) Cost and
Actual Production Cost.

Used For:
    - Production Variance
    - Cost Control
    - Management Reports
    - Six Sigma
===============================================================================
*/

-- ============================================================================
-- Material Variance
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_material_variance(

    p_planned_cost NUMERIC,

    p_actual_cost NUMERIC

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$
BEGIN

    RETURN COALESCE(p_actual_cost,0)
         - COALESCE(p_planned_cost,0);

END;

$$;

-- ============================================================================
-- Labour Variance
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_labour_variance(

    p_planned_cost NUMERIC,

    p_actual_cost NUMERIC

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$
BEGIN

    RETURN COALESCE(p_actual_cost,0)
         - COALESCE(p_planned_cost,0);

END;

$$;

-- ============================================================================
-- Overhead Variance
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_overhead_variance(

    p_planned_cost NUMERIC,

    p_actual_cost NUMERIC

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$
BEGIN

    RETURN COALESCE(p_actual_cost,0)
         - COALESCE(p_planned_cost,0);

END;

$$;

-- ============================================================================
-- Total Cost Variance
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_total_variance(

    p_planned_cost NUMERIC,

    p_actual_cost NUMERIC

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$
BEGIN

    RETURN COALESCE(p_actual_cost,0)
         - COALESCE(p_planned_cost,0);

END;

$$;

-- ============================================================================
-- Variance Percentage
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_variance_percentage(

    p_planned_cost NUMERIC,

    p_actual_cost NUMERIC

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

BEGIN

    IF COALESCE(p_planned_cost,0) = 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND(

        (

            (p_actual_cost - p_planned_cost)

            /

            p_planned_cost

        ) * 100,

        2

    );

END;

$$;

-- ============================================================================
-- Cost Performance Rating
-- ============================================================================

CREATE OR REPLACE FUNCTION get_cost_performance_rating(

    p_variance_percent NUMERIC

)

RETURNS TEXT

LANGUAGE plpgsql

AS
$$

BEGIN

    RETURN CASE

        WHEN p_variance_percent <= -10 THEN 'EXCELLENT'

        WHEN p_variance_percent <= -3 THEN 'GOOD'

        WHEN p_variance_percent <= 3 THEN 'ON_TARGET'

        WHEN p_variance_percent <= 10 THEN 'ATTENTION'

        ELSE 'CRITICAL'

    END;

END;

$$;
