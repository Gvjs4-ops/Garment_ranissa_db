/*
===============================================================================
002_inventory_costing.sql

Purpose:
    Inventory Costing Functions

Costing Method:
    Weighted Average Cost (WAC)

Used By:
    - Goods Receipt
    - Production
    - Sales
    - Inventory Adjustment
===============================================================================
*/

-- ============================================================================
-- Get Current Average Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION get_current_item_cost(

    p_company_id UUID,
    p_item_id UUID

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_cost NUMERIC(18,6);

BEGIN

    SELECT average_cost
    INTO v_cost
    FROM item_master
    WHERE company_id = p_company_id
      AND id = p_item_id;

    RETURN COALESCE(v_cost,0);

END;

$$;

-- ============================================================================
-- Get Current Stock Quantity
-- ============================================================================

CREATE OR REPLACE FUNCTION get_stock_quantity(

    p_company_id UUID,
    p_item_id UUID

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_qty NUMERIC(18,4);

BEGIN

    SELECT COALESCE(SUM(quantity_on_hand),0)
    INTO v_qty
    FROM inventory_balance
    WHERE company_id = p_company_id
      AND item_id = p_item_id;

    RETURN v_qty;

END;

$$;

-- ============================================================================
-- Calculate Weighted Average Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_weighted_average_cost(

    p_company_id UUID,
    p_item_id UUID,
    p_received_qty NUMERIC,
    p_received_cost NUMERIC

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_old_qty NUMERIC;

    v_old_cost NUMERIC;

    v_new_cost NUMERIC;

BEGIN

    v_old_qty :=
        get_stock_quantity(
            p_company_id,
            p_item_id
        );

    v_old_cost :=
        get_current_item_cost(
            p_company_id,
            p_item_id
        );

    IF (v_old_qty + p_received_qty) = 0 THEN

        RETURN p_received_cost;

    END IF;

    v_new_cost :=
    (

        (v_old_qty * v_old_cost)

        +

        (p_received_qty * p_received_cost)

    )

    /

    (v_old_qty + p_received_qty);

    RETURN ROUND(v_new_cost,6);

END;

$$;

-- ============================================================================
-- Update Item Average Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION update_item_average_cost(

    p_company_id UUID,

    p_item_id UUID,

    p_new_cost NUMERIC

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE item_master

    SET

        average_cost = p_new_cost,

        updated_at = NOW()

    WHERE company_id = p_company_id

      AND id = p_item_id;

END;

$$;

-- ============================================================================
-- Recalculate Average Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_item_average_cost(

    p_company_id UUID,

    p_item_id UUID,

    p_received_qty NUMERIC,

    p_received_cost NUMERIC

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_cost NUMERIC;

BEGIN

    v_cost :=
        calculate_weighted_average_cost(

            p_company_id,

            p_item_id,

            p_received_qty,

            p_received_cost

        );

    PERFORM update_item_average_cost(

        p_company_id,

        p_item_id,

        v_cost

    );

    RETURN v_cost;

END;

$$;

-- ============================================================================
-- Inventory Value
-- ============================================================================

CREATE OR REPLACE FUNCTION get_inventory_value(

    p_company_id UUID

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_total NUMERIC;

BEGIN

    SELECT
        COALESCE(
            SUM(
                quantity_on_hand * average_cost
            ),
            0
        )

    INTO v_total

    FROM inventory_balance

    WHERE company_id = p_company_id;

    RETURN v_total;

END;

$$;

-- ============================================================================
-- Item Inventory Value
-- ============================================================================

CREATE OR REPLACE FUNCTION get_item_inventory_value(

    p_company_id UUID,

    p_item_id UUID

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_value NUMERIC;

BEGIN

    SELECT
        COALESCE(
            SUM(
                quantity_on_hand * average_cost
            ),
            0
        )

    INTO v_value

    FROM inventory_balance

    WHERE company_id = p_company_id

      AND item_id = p_item_id;

    RETURN v_value;

END;

$$;
