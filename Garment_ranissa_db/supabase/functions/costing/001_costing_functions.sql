BEGIN;

------------------------------------------------------------
-- CALCULATE MATERIAL COST
------------------------------------------------------------

CREATE OR REPLACE FUNCTION calculate_material_cost(

    p_bom_id UUID

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_cost NUMERIC(18,4);

BEGIN

    SELECT

        COALESCE(
            SUM(
                bi.quantity *
                (1 + (bi.wastage_percent / 100.0)) *
                COALESCE(ib.average_cost,0)
            ),
            0
        )

    INTO v_cost

    FROM bom_item bi

    JOIN inventory_balance ib
      ON ib.item_id = bi.item_id

    WHERE bi.bom_id = p_bom_id;

    RETURN COALESCE(v_cost,0);

END;

$$;

------------------------------------------------------------
-- CALCULATE LABOR COST
------------------------------------------------------------

CREATE OR REPLACE FUNCTION calculate_labor_cost(

    p_company_id UUID

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_cost NUMERIC(18,4);

BEGIN

    SELECT

        COALESCE(SUM(rate_per_hour),0)

    INTO v_cost

    FROM labor_rate

    WHERE company_id = p_company_id

      AND is_active = TRUE

      AND CURRENT_DATE BETWEEN effective_from
                           AND COALESCE(effective_to,'2999-12-31');

    RETURN COALESCE(v_cost,0);

END;

$$;

------------------------------------------------------------
-- CALCULATE OVERHEAD COST
------------------------------------------------------------

CREATE OR REPLACE FUNCTION calculate_overhead_cost(

    p_company_id UUID

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_cost NUMERIC(18,4);

BEGIN

    SELECT

        COALESCE(SUM(rate),0)

    INTO v_cost

    FROM overhead_rate

    WHERE company_id = p_company_id

      AND is_active = TRUE

      AND CURRENT_DATE BETWEEN effective_from
                           AND COALESCE(effective_to,'2999-12-31');

    RETURN COALESCE(v_cost,0);

END;

$$;

------------------------------------------------------------
-- CALCULATE COST SHEET
------------------------------------------------------------

CREATE OR REPLACE FUNCTION calculate_cost_sheet(

    p_cost_sheet_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_company UUID;

    v_bom UUID;

    v_material NUMERIC(18,4);

    v_labor NUMERIC(18,4);

    v_overhead NUMERIC(18,4);

    v_other NUMERIC(18,4);

BEGIN

    SELECT

        cs.company_id,
        bom.id

    INTO

        v_company,
        v_bom

    FROM cost_sheet cs

    JOIN style_version sv
      ON sv.id = cs.style_version_id

    JOIN bill_of_material bom
      ON bom.style_version_id = sv.id
     AND bom.is_active = TRUE

    WHERE cs.id = p_cost_sheet_id

    LIMIT 1;

    v_material := calculate_material_cost(v_bom);

    v_labor := calculate_labor_cost(v_company);

    v_overhead := calculate_overhead_cost(v_company);

    SELECT

        COALESCE(
            SUM(amount),
            0
        )

    INTO v_other

    FROM cost_sheet_item

    WHERE cost_sheet_id = p_cost_sheet_id

      AND component_id IN (

        SELECT id

        FROM cost_component

        WHERE component_type = 'OTHER'

      );

    UPDATE cost_sheet

    SET

        total_material_cost = v_material,

        total_labor_cost = v_labor,

        total_overhead_cost = v_overhead,

        total_other_cost = v_other,

        total_cost =
            v_material +
            v_labor +
            v_overhead +
            v_other,

        updated_at = NOW()

    WHERE id = p_cost_sheet_id;

END;

$$;

------------------------------------------------------------
-- GET STYLE COST
------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_style_cost(

    p_style_version UUID

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_cost NUMERIC(18,4);

BEGIN

    SELECT

        total_cost

    INTO v_cost

    FROM cost_sheet

    WHERE style_version_id = p_style_version

      AND status = 'APPROVED'

    ORDER BY revision_no DESC

    LIMIT 1;

    RETURN COALESCE(v_cost,0);

END;

$$;

------------------------------------------------------------
-- APPROVE COST SHEET
------------------------------------------------------------

CREATE OR REPLACE FUNCTION approve_cost_sheet(

    p_cost_sheet UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    PERFORM calculate_cost_sheet(
        p_cost_sheet
    );

    UPDATE cost_sheet

    SET

        status = 'APPROVED',

        updated_at = NOW()

    WHERE id = p_cost_sheet;

END;

$$;

COMMIT;