/*
===============================================================================
004_bom_costing.sql

Purpose:
    Bill of Materials (BOM) Cost Rollup

Description
-----------
Calculates the planned manufacturing cost of a style/product based on:

- Material Cost
- Operation Cost
- Overhead Cost

The resulting cost becomes the Planned Cost used by
Production Orders for Planned vs Actual variance analysis.
===============================================================================
*/

-- ============================================================================
-- Calculate BOM Material Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_bom_material_cost(

    p_bom_id UUID

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_cost NUMERIC(18,6);

BEGIN

    SELECT

        COALESCE(

            SUM(

                quantity * unit_cost

            ),

            0

        )

    INTO v_cost

    FROM bill_of_material_item

    WHERE bom_id = p_bom_id;

    RETURN v_cost;

END;

$$;

-- ============================================================================
-- Calculate BOM Operation Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_bom_operation_cost(

    p_bom_id UUID

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_cost NUMERIC(18,6);

BEGIN

    SELECT

        COALESCE(

            SUM(

                standard_minutes
                *
                cost_per_minute

            ),

            0

        )

    INTO v_cost

    FROM bill_of_material_operation

    WHERE bom_id = p_bom_id;

    RETURN v_cost;

END;

$$;

-- ============================================================================
-- Calculate BOM Overhead Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_bom_overhead_cost(

    p_bom_id UUID

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_cost NUMERIC(18,6);

BEGIN

    SELECT

        COALESCE(

            SUM(amount),

            0

        )

    INTO v_cost

    FROM bill_of_material_overhead

    WHERE bom_id = p_bom_id;

    RETURN v_cost;

END;

$$;

-- ============================================================================
-- Calculate Total BOM Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_bom_total_cost(

    p_bom_id UUID

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_material NUMERIC;

    v_operation NUMERIC;

    v_overhead NUMERIC;

BEGIN

    v_material :=
        calculate_bom_material_cost(
            p_bom_id
        );

    v_operation :=
        calculate_bom_operation_cost(
            p_bom_id
        );

    v_overhead :=
        calculate_bom_overhead_cost(
            p_bom_id
        );

    RETURN

        v_material

        + v_operation

        + v_overhead;

END;

$$;

-- ============================================================================
-- Rollup BOM Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION rollup_bom_cost(

    p_bom_id UUID

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_total NUMERIC;

BEGIN

    v_total :=
        calculate_bom_total_cost(
            p_bom_id
        );

    UPDATE bill_of_material

    SET

        planned_cost = v_total,

        updated_at = NOW()

    WHERE id = p_bom_id;

    RETURN v_total;

END;

$$;

-- ============================================================================
-- Planned Unit Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_bom_unit_cost(

    p_bom_id UUID,

    p_quantity NUMERIC

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_total NUMERIC;

BEGIN

    IF p_quantity <= 0 THEN

        RAISE EXCEPTION
        'Quantity must be greater than zero.';
    END IF;

    v_total :=
        calculate_bom_total_cost(
            p_bom_id
        );

    RETURN ROUND(
        v_total / p_quantity,
        6
    );

END;

$$;
