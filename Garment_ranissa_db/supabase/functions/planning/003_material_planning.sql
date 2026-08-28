/*
===============================================================================
003_material_planning.sql

Purpose:
    Material Requirement Planning (MRP)

===============================================================================
*/

-- ============================================================================
-- Generate Material Requirements
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_material_requirements(

    p_plan_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    INSERT INTO material_requirement(

        production_plan_line_id,
        item_id,
        required_quantity,
        reserved_quantity,
        available_quantity,
        shortage_quantity,
        status

    )

    SELECT

        ppl.id,

        bmi.item_id,

        ppl.planned_quantity * bmi.quantity,

        0,

        0,

        0,

        'PLANNED'

    FROM production_plan_line ppl

    JOIN bill_of_material bom

        ON bom.style_id = ppl.style_id

    JOIN bill_of_material_item bmi

        ON bmi.bom_id = bom.id

    WHERE ppl.production_plan_id = p_plan_id;

END;

$$;

-- ============================================================================
-- Update Inventory Availability
-- ============================================================================

CREATE OR REPLACE FUNCTION update_material_availability(

    p_plan_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE material_requirement mr

    SET

        available_quantity =

        get_stock_quantity(

            mr.item_id

        )

    WHERE EXISTS (

        SELECT 1

        FROM production_plan_line ppl

        WHERE ppl.id = mr.production_plan_line_id
          AND ppl.production_plan_id = p_plan_id

    );

END;

$$;

-- ============================================================================
-- Calculate Material Shortage
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_material_shortage(

    p_plan_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE material_requirement mr

    SET

        shortage_quantity = GREATEST(

            required_quantity

            -

            available_quantity,

            0

        )

    WHERE EXISTS (

        SELECT 1

        FROM production_plan_line ppl

        WHERE ppl.id = mr.production_plan_line_id
          AND ppl.production_plan_id = p_plan_id

    );

END;

$$;

-- ============================================================================
-- Reserve Materials
-- ============================================================================

CREATE OR REPLACE FUNCTION reserve_materials(

    p_plan_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE material_requirement mr

    SET

        reserved_quantity = LEAST(

            required_quantity,

            available_quantity

        ),

        status = CASE

            WHEN available_quantity >= required_quantity

            THEN 'RESERVED'

            ELSE 'PARTIAL'

        END

    WHERE EXISTS (

        SELECT 1

        FROM production_plan_line ppl

        WHERE ppl.id = mr.production_plan_line_id
          AND ppl.production_plan_id = p_plan_id

    );

END;

$$;

-- ============================================================================
-- Generate Purchase Requisition
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_purchase_requisition(

    p_plan_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    INSERT INTO purchase_requisition_line(

        item_id,

        requested_quantity,

        source,

        reference_id,

        status

    )

    SELECT

        item_id,

        shortage_quantity,

        'MRP',

        production_plan_line_id,

        'OPEN'

    FROM material_requirement

    WHERE shortage_quantity > 0

      AND EXISTS (

            SELECT 1

            FROM production_plan_line ppl

            WHERE ppl.id = material_requirement.production_plan_line_id
              AND ppl.production_plan_id = p_plan_id

      );

END;

$$;

-- ============================================================================
-- Execute Complete MRP
-- ============================================================================

CREATE OR REPLACE FUNCTION run_mrp(

    p_plan_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    PERFORM generate_material_requirements(

        p_plan_id

    );

    PERFORM update_material_availability(

        p_plan_id

    );

    PERFORM calculate_material_shortage(

        p_plan_id

    );

    PERFORM reserve_materials(

        p_plan_id

    );

    PERFORM generate_purchase_requisition(

        p_plan_id

    );

END;

$$;
