/*
===============================================================================
003_production_costing.sql

Purpose:
    Production Costing Functions

These functions calculate the manufacturing cost of finished goods.

Cost Components
---------------
1. Material Cost
2. Labour Cost
3. Machine Cost
4. Overhead Cost
5. Subcontract Cost

===============================================================================
*/

-- ============================================================================
-- Calculate Material Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_material_cost(

    p_production_order_id UUID

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
                consumed_quantity * unit_cost
            ),
            0
        )

    INTO v_cost

    FROM production_material

    WHERE production_order_id = p_production_order_id;

    RETURN v_cost;

END;

$$;

-- ============================================================================
-- Calculate Labour Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_labour_cost(

    p_production_order_id UUID

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
                hours_worked * hourly_rate
            ),
            0
        )

    INTO v_cost

    FROM production_labour

    WHERE production_order_id = p_production_order_id;

    RETURN v_cost;

END;

$$;

-- ============================================================================
-- Calculate Machine Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_machine_cost(

    p_production_order_id UUID

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
                machine_hours * machine_rate
            ),
            0
        )

    INTO v_cost

    FROM production_machine

    WHERE production_order_id = p_production_order_id;

    RETURN v_cost;

END;

$$;

-- ============================================================================
-- Calculate Overhead Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_overhead_cost(

    p_production_order_id UUID

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
                amount
            ),
            0
        )

    INTO v_cost

    FROM production_overhead

    WHERE production_order_id = p_production_order_id;

    RETURN v_cost;

END;

$$;

-- ============================================================================
-- Calculate Subcontract Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_subcontract_cost(

    p_production_order_id UUID

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
                amount
            ),
            0
        )

    INTO v_cost

    FROM production_subcontract

    WHERE production_order_id = p_production_order_id;

    RETURN v_cost;

END;

$$;

-- ============================================================================
-- Calculate Finished Goods Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_finished_goods_cost(

    p_production_order_id UUID

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_material NUMERIC;

    v_labour NUMERIC;

    v_machine NUMERIC;

    v_overhead NUMERIC;

    v_subcontract NUMERIC;

BEGIN

    v_material :=
        calculate_material_cost(
            p_production_order_id
        );

    v_labour :=
        calculate_labour_cost(
            p_production_order_id
        );

    v_machine :=
        calculate_machine_cost(
            p_production_order_id
        );

    v_overhead :=
        calculate_overhead_cost(
            p_production_order_id
        );

    v_subcontract :=
        calculate_subcontract_cost(
            p_production_order_id
        );

    RETURN

        v_material

        + v_labour

        + v_machine

        + v_overhead

        + v_subcontract;

END;

$$;

-- ============================================================================
-- Calculate Unit Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_unit_cost(

    p_production_order_id UUID,

    p_finished_quantity NUMERIC

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_total NUMERIC;

BEGIN

    IF p_finished_quantity <= 0 THEN

        RAISE EXCEPTION
            'Finished quantity must be greater than zero.';

    END IF;

    v_total :=
        calculate_finished_goods_cost(
            p_production_order_id
        );

    RETURN ROUND(
        v_total / p_finished_quantity,
        6
    );

END;

$$;
