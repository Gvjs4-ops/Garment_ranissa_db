/*
===============================================================================
001_production_planning.sql

Purpose:
    Production Planning Functions

===============================================================================
*/

-- ============================================================================
-- Create Production Plan
-- ============================================================================

CREATE OR REPLACE FUNCTION create_production_plan(

    p_company_id UUID,
    p_plan_number TEXT,
    p_plan_date DATE,
    p_start_date DATE,
    p_end_date DATE,
    p_priority TEXT,
    p_planner_id UUID,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_plan_id UUID;

BEGIN

    INSERT INTO production_plan(

        company_id,
        plan_number,
        plan_date,
        start_date,
        end_date,
        priority,
        planner_id,
        created_by

    )

    VALUES(

        p_company_id,
        p_plan_number,
        p_plan_date,
        p_start_date,
        p_end_date,
        p_priority,
        p_planner_id,
        p_user_id

    )

    RETURNING id
    INTO v_plan_id;

    RETURN v_plan_id;

END;

$$;

-- ============================================================================
-- Add Production Plan Line
-- ============================================================================

CREATE OR REPLACE FUNCTION add_production_plan_line(

    p_plan_id UUID,
    p_sales_order_id UUID,
    p_sales_order_line_id UUID,
    p_style_id UUID,
    p_color_id UUID,
    p_size_id UUID,
    p_quantity NUMERIC,
    p_start_date DATE,
    p_end_date DATE

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_line_id UUID;

BEGIN

    INSERT INTO production_plan_line(

        production_plan_id,
        sales_order_id,
        sales_order_line_id,
        style_id,
        color_id,
        size_id,
        planned_quantity,
        planned_start_date,
        planned_end_date

    )

    VALUES(

        p_plan_id,
        p_sales_order_id,
        p_sales_order_line_id,
        p_style_id,
        p_color_id,
        p_size_id,
        p_quantity,
        p_start_date,
        p_end_date

    )

    RETURNING id
    INTO v_line_id;

    RETURN v_line_id;

END;

$$;

-- ============================================================================
-- Approve Production Plan
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_production_plan(

    p_plan_id UUID,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_plan

    SET

        status = 'APPROVED',

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_plan_id;

END;

$$;

-- ============================================================================
-- Release Production Plan
-- ============================================================================

CREATE OR REPLACE FUNCTION release_production_plan(

    p_plan_id UUID,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_plan

    SET

        status = 'RELEASED',

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_plan_id;

END;

$$;

-- ============================================================================
-- Cancel Production Plan
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_production_plan(

    p_plan_id UUID,
    p_reason TEXT,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_plan

    SET

        status = 'CANCELLED',

        remarks = p_reason,

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_plan_id;

END;

$$;

-- ============================================================================
-- Convert Plan To Production Order
-- ============================================================================

CREATE OR REPLACE FUNCTION create_production_order_from_plan(

    p_plan_id UUID,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_production_order_id UUID;

BEGIN

    /*
        Placeholder

        Future implementation will:

        - Read plan lines
        - Generate Production Order
        - Copy BOM
        - Create Operations
        - Reserve Materials
        - Generate Bundles
    */

    INSERT INTO production_order(

        company_id,
        status,
        created_by

    )

    SELECT

        company_id,

        'PLANNED',

        p_user_id

    FROM production_plan

    WHERE id = p_plan_id

    RETURNING id
    INTO v_production_order_id;

    RETURN v_production_order_id;

END;

$$;
