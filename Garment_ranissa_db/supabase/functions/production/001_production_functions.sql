BEGIN;

------------------------------------------------------------
-- CALCULATE MATERIAL CONSUMPTION
------------------------------------------------------------

CREATE OR REPLACE FUNCTION calculate_material_consumption(

    p_production_order_id UUID

)

RETURNS TABLE (

    item_id UUID,
    required_quantity NUMERIC(18,3)

)

LANGUAGE plpgsql

AS
$$

BEGIN

    RETURN QUERY

    SELECT

        bi.item_id,

        po.planned_quantity *
        bi.quantity *
        (1 + (bi.wastage_percent / 100.0))

    FROM production_order po

    JOIN bill_of_material bom
      ON bom.id = po.bom_id

    JOIN bom_item bi
      ON bi.bom_id = bom.id

    WHERE po.id = p_production_order_id;

END;

$$;

------------------------------------------------------------
-- ISSUE MATERIALS
------------------------------------------------------------

CREATE OR REPLACE FUNCTION issue_materials(

    p_production_order_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_company UUID;

    v_warehouse UUID;

    r RECORD;

BEGIN

    SELECT

        company_id,
        warehouse_id

    INTO

        v_company,
        v_warehouse

    FROM production_order

    WHERE id = p_production_order_id;

    FOR r IN

        SELECT *

        FROM calculate_material_consumption(
            p_production_order_id
        )

    LOOP

        PERFORM inventory_out(

            v_company,
            v_warehouse,
            r.item_id,
            r.required_quantity,
            0,
            'PRODUCTION_ORDER',
            p_production_order_id,
            'Production Material Issue'

        );

    END LOOP;

    UPDATE production_order

    SET

        status='IN_PROGRESS',
        updated_at=NOW()

    WHERE id=p_production_order_id;

END;

$$;

------------------------------------------------------------
-- RECEIVE FINISHED GOODS
------------------------------------------------------------

CREATE OR REPLACE FUNCTION receive_finished_goods(

    p_production_order_id UUID,
    p_received_quantity NUMERIC

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_company UUID;

    v_warehouse UUID;

    v_item UUID;

BEGIN

    SELECT

        po.company_id,
        po.warehouse_id,
        sv.finished_good_item_id

    INTO

        v_company,
        v_warehouse,
        v_item

    FROM production_order po

    JOIN style_variant sv
      ON sv.id = po.style_variant_id

    WHERE po.id = p_production_order_id;

    PERFORM inventory_in(

        v_company,
        v_warehouse,
        v_item,
        p_received_quantity,
        get_style_cost(
            (
                SELECT version_id
                FROM style_colorway
                WHERE id = (
                    SELECT colorway_id
                    FROM style_variant
                    WHERE id = (
                        SELECT style_variant_id
                        FROM production_order
                        WHERE id = p_production_order_id
                    )
                )
            )
        ),
        'PRODUCTION_ORDER',
        p_production_order_id,
        'Finished Goods Receipt'

    );

    UPDATE production_order

    SET

        completed_quantity =
            completed_quantity +
            p_received_quantity,

        updated_at = NOW()

    WHERE id = p_production_order_id;

END;

$$;

------------------------------------------------------------
-- CLOSE PRODUCTION ORDER
------------------------------------------------------------

CREATE OR REPLACE FUNCTION close_production_order(

    p_production_order_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE production_order

    SET

        status='COMPLETED',
        updated_at=NOW()

    WHERE id=p_production_order_id;

END;

$$;

------------------------------------------------------------
-- CREATE PRODUCTION ORDER
------------------------------------------------------------

CREATE OR REPLACE FUNCTION create_production_order(

    p_company UUID,
    p_style_variant UUID,
    p_bom UUID,
    p_warehouse UUID,
    p_quantity NUMERIC

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_id UUID;

BEGIN

    INSERT INTO production_order(

        tenant_id,
        company_id,
        production_number,
        style_variant_id,
        bom_id,
        warehouse_id,
        planned_quantity,
        production_date,
        status

    )

    VALUES(

        current_tenant_id(),
        p_company,
        generate_document_number(
            p_company,
            'PRODUCTION_ORDER',
            to_char(CURRENT_DATE,'YYYY')
        ),
        p_style_variant,
        p_bom,
        p_warehouse,
        p_quantity,
        CURRENT_DATE,
        'PLANNED'

    )

    RETURNING id

    INTO v_id;

    RETURN v_id;

END;

$$;

COMMIT;