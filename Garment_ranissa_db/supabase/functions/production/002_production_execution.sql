/*
===============================================================================
002_production_execution.sql

Purpose:
    Production Execution Functions

These functions execute the production lifecycle.

Workflow

Production Order
        ↓
Start Production
        ↓
Issue Materials
        ↓
Record Operations
        ↓
Record Scrap
        ↓
Receive Finished Goods
        ↓
Close Production Order

===============================================================================
*/

-- ============================================================================
-- Start Production Order
-- ============================================================================

CREATE OR REPLACE FUNCTION start_production_order(

    p_production_order_id UUID,
    p_started_by UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$
BEGIN

    UPDATE production_order

    SET

        status = 'IN_PROGRESS',

        started_at = NOW(),

        started_by = p_started_by,

        updated_at = NOW()

    WHERE id = p_production_order_id;

END;

$$;

-- ============================================================================
-- Issue Material
-- ============================================================================

CREATE OR REPLACE FUNCTION issue_material_to_production(

    p_company_id UUID,

    p_production_order_id UUID,

    p_item_id UUID,

    p_warehouse_id UUID,

    p_quantity NUMERIC,

    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$
BEGIN

    PERFORM inventory_out(

        p_company_id,

        p_warehouse_id,

        p_item_id,

        p_quantity,

        'PRODUCTION',

        p_production_order_id

    );

END;

$$;

-- ============================================================================
-- Record Operation Completion
-- ============================================================================

CREATE OR REPLACE FUNCTION record_operation_completion(

    p_production_order_id UUID,

    p_operation_id UUID,

    p_completed_quantity NUMERIC,

    p_operator_id UUID,

    p_machine_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$
BEGIN

    INSERT INTO production_operation_log(

        production_order_id,

        operation_id,

        operator_id,

        machine_id,

        completed_quantity,

        completed_at

    )

    VALUES(

        p_production_order_id,

        p_operation_id,

        p_operator_id,

        p_machine_id,

        p_completed_quantity,

        NOW()

    );

END;

$$;

-- ============================================================================
-- Record Scrap
-- ============================================================================

CREATE OR REPLACE FUNCTION record_scrap(

    p_production_order_id UUID,

    p_item_id UUID,

    p_quantity NUMERIC,

    p_reason TEXT

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$
BEGIN

    INSERT INTO production_scrap(

        production_order_id,

        item_id,

        quantity,

        reason,

        created_at

    )

    VALUES(

        p_production_order_id,

        p_item_id,

        p_quantity,

        p_reason,

        NOW()

    );

END;

$$;

-- ============================================================================
-- Receive Finished Goods
-- ============================================================================

CREATE OR REPLACE FUNCTION receive_finished_goods(

    p_company_id UUID,

    p_production_order_id UUID,

    p_finished_item_id UUID,

    p_warehouse_id UUID,

    p_quantity NUMERIC,

    p_unit_cost NUMERIC

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$
BEGIN

    PERFORM inventory_in(

        p_company_id,

        p_warehouse_id,

        p_finished_item_id,

        p_quantity,

        p_unit_cost,

        'PRODUCTION',

        p_production_order_id

    );

END;

$$;

-- ============================================================================
-- Close Production Order
-- ============================================================================

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

        status = 'COMPLETED',

        completed_at = NOW(),

        updated_at = NOW()

    WHERE id = p_production_order_id;

END;

$$;
