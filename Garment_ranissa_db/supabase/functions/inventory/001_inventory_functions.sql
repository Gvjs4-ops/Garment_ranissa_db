BEGIN;

------------------------------------------------------------
-- GET STOCK ON HAND
------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_stock_on_hand(

    p_company_id UUID,
    p_warehouse_id UUID,
    p_item_id UUID

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_quantity NUMERIC(18,3);

BEGIN

    SELECT
        quantity_on_hand
    INTO
        v_quantity
    FROM
        inventory_balance
    WHERE
        company_id = p_company_id
        AND warehouse_id = p_warehouse_id
        AND item_id = p_item_id;

    RETURN COALESCE(v_quantity,0);

END;

$$;

------------------------------------------------------------
-- GET AVAILABLE STOCK
------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_available_stock(

    p_company_id UUID,
    p_warehouse_id UUID,
    p_item_id UUID

)

RETURNS NUMERIC

LANGUAGE plpgsql

AS
$$

DECLARE

    v_quantity NUMERIC(18,3);

BEGIN

    SELECT
        quantity_available
    INTO
        v_quantity
    FROM
        inventory_balance
    WHERE
        company_id = p_company_id
        AND warehouse_id = p_warehouse_id
        AND item_id = p_item_id;

    RETURN COALESCE(v_quantity,0);

END;

$$;

------------------------------------------------------------
-- RECALCULATE INVENTORY BALANCE
------------------------------------------------------------

CREATE OR REPLACE FUNCTION recalculate_inventory_balance(

    p_company_id UUID,
    p_warehouse_id UUID,
    p_item_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_in NUMERIC(18,3);

    v_out NUMERIC(18,3);

    v_reserved NUMERIC(18,3);

BEGIN

    SELECT
        COALESCE(SUM(quantity_in),0),
        COALESCE(SUM(quantity_out),0)
    INTO
        v_in,
        v_out
    FROM
        inventory_transaction
    WHERE
        company_id = p_company_id
        AND warehouse_id = p_warehouse_id
        AND item_id = p_item_id;

    SELECT
        COALESCE(quantity_reserved,0)
    INTO
        v_reserved
    FROM
        inventory_balance
    WHERE
        company_id = p_company_id
        AND warehouse_id = p_warehouse_id
        AND item_id = p_item_id;

    INSERT INTO inventory_balance (

        tenant_id,
        company_id,
        warehouse_id,
        item_id,
        quantity_on_hand,
        quantity_reserved,
        quantity_available,
        average_cost,
        last_updated

    )

    VALUES (

        current_tenant_id(),
        p_company_id,
        p_warehouse_id,
        p_item_id,
        (v_in-v_out),
        COALESCE(v_reserved,0),
        (v_in-v_out)-COALESCE(v_reserved,0),
        0,
        NOW()

    )

    ON CONFLICT (warehouse_id,item_id)

    DO UPDATE SET

        quantity_on_hand = EXCLUDED.quantity_on_hand,
        quantity_reserved = EXCLUDED.quantity_reserved,
        quantity_available = EXCLUDED.quantity_available,
        last_updated = NOW();

END;

$$;

------------------------------------------------------------
-- INVENTORY IN
------------------------------------------------------------

CREATE OR REPLACE FUNCTION inventory_in(

    p_company_id UUID,
    p_warehouse_id UUID,
    p_item_id UUID,
    p_quantity NUMERIC,
    p_unit_cost NUMERIC,
    p_reference_type VARCHAR,
    p_reference_id UUID,
    p_remarks TEXT DEFAULT NULL

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    INSERT INTO inventory_transaction (

        tenant_id,
        company_id,
        warehouse_id,
        item_id,
        transaction_type,
        reference_type,
        reference_id,
        quantity_in,
        quantity_out,
        unit_cost,
        remarks

    )

    VALUES (

        current_tenant_id(),
        p_company_id,
        p_warehouse_id,
        p_item_id,
        'IN',
        p_reference_type,
        p_reference_id,
        p_quantity,
        0,
        p_unit_cost,
        p_remarks

    );

    PERFORM recalculate_inventory_balance(
        p_company_id,
        p_warehouse_id,
        p_item_id
    );

END;

$$;

------------------------------------------------------------
-- INVENTORY OUT
------------------------------------------------------------

CREATE OR REPLACE FUNCTION inventory_out(

    p_company_id UUID,
    p_warehouse_id UUID,
    p_item_id UUID,
    p_quantity NUMERIC,
    p_unit_cost NUMERIC,
    p_reference_type VARCHAR,
    p_reference_id UUID,
    p_remarks TEXT DEFAULT NULL

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    IF get_available_stock(
        p_company_id,
        p_warehouse_id,
        p_item_id
    ) < p_quantity THEN

        RAISE EXCEPTION
        'Insufficient stock.';

    END IF;

    INSERT INTO inventory_transaction (

        tenant_id,
        company_id,
        warehouse_id,
        item_id,
        transaction_type,
        reference_type,
        reference_id,
        quantity_in,
        quantity_out,
        unit_cost,
        remarks

    )

    VALUES (

        current_tenant_id(),
        p_company_id,
        p_warehouse_id,
        p_item_id,
        'OUT',
        p_reference_type,
        p_reference_id,
        0,
        p_quantity,
        p_unit_cost,
        p_remarks

    );

    PERFORM recalculate_inventory_balance(
        p_company_id,
        p_warehouse_id,
        p_item_id
    );

END;

$$;

------------------------------------------------------------
-- INVENTORY TRANSFER
------------------------------------------------------------

CREATE OR REPLACE FUNCTION inventory_transfer(

    p_company_id UUID,
    p_from_warehouse UUID,
    p_to_warehouse UUID,
    p_item_id UUID,
    p_quantity NUMERIC,
    p_unit_cost NUMERIC,
    p_reference_type VARCHAR,
    p_reference_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    PERFORM inventory_out(

        p_company_id,
        p_from_warehouse,
        p_item_id,
        p_quantity,
        p_unit_cost,
        p_reference_type,
        p_reference_id,
        'Warehouse Transfer - OUT'

    );

    PERFORM inventory_in(

        p_company_id,
        p_to_warehouse,
        p_item_id,
        p_quantity,
        p_unit_cost,
        p_reference_type,
        p_reference_id,
        'Warehouse Transfer - IN'

    );

END;

$$;

COMMIT;