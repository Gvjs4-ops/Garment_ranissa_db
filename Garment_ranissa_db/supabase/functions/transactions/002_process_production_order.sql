/*
===============================================================================
002_process_production_order.sql

Purpose:
    Process a Production Order transaction atomically.

Responsibilities
----------------
- Validate Production Order
- Allocate Materials
- Create Production Bundles
- Issue Materials
- Execute Production
- Receive Finished Goods
- Calculate Actual Cost
- Post Accounting Entries
- Close Production Order
===============================================================================
*/

CREATE OR REPLACE FUNCTION process_production_order(

    p_company_id UUID,

    p_user_id UUID,

    p_document JSONB

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    --------------------------------------------------------------------------
    -- Header
    --------------------------------------------------------------------------

    v_production_order_id UUID;

    v_finished_item_id UUID;

    v_warehouse_id UUID;

    v_production_date DATE;

    v_finished_quantity NUMERIC;

    v_unit_cost NUMERIC;

    v_document_number TEXT;

    --------------------------------------------------------------------------
    -- Material Loop
    --------------------------------------------------------------------------

    v_material JSONB;

    --------------------------------------------------------------------------
    -- Bundle Loop
    --------------------------------------------------------------------------

    v_bundle JSONB;

    --------------------------------------------------------------------------
    -- Accounting
    --------------------------------------------------------------------------

    v_journal_id UUID;

BEGIN

    --------------------------------------------------------------------------
    -- Extract Header
    --------------------------------------------------------------------------

    v_production_order_id :=
        (p_document->>'productionOrderId')::UUID;

    v_finished_item_id :=
        (p_document->>'finishedItemId')::UUID;

    v_warehouse_id :=
        (p_document->>'warehouseId')::UUID;

    v_production_date :=
        (p_document->>'productionDate')::DATE;

    v_finished_quantity :=
        (p_document->>'finishedQuantity')::NUMERIC;

    --------------------------------------------------------------------------
    -- Validation
    --------------------------------------------------------------------------

    -- TODO
    -- Validate Company
    -- Validate Production Order
    -- Validate Status
    -- Validate Warehouse
    -- Validate Finished Item

    --------------------------------------------------------------------------
    -- Issue Materials
    --------------------------------------------------------------------------

    FOR v_material IN

        SELECT *

        FROM jsonb_array_elements(
            p_document->'materials'
        )

    LOOP

        PERFORM issue_material_to_production(

            p_company_id,

            v_production_order_id,

            (v_material->>'itemId')::UUID,

            v_warehouse_id,

            (v_material->>'quantity')::NUMERIC,

            p_user_id

        );

    END LOOP;

    --------------------------------------------------------------------------
    -- Create Bundles
    --------------------------------------------------------------------------

    FOR v_bundle IN

        SELECT *

        FROM jsonb_array_elements(
            p_document->'bundles'
        )

    LOOP

        PERFORM create_bundle(

            p_company_id,

            v_production_order_id,

            v_bundle->>'bundleNumber',

            v_finished_item_id,

            (v_bundle->>'operationId')::UUID,

            (v_bundle->>'quantity')::NUMERIC,

            p_user_id

        );

    END LOOP;

    --------------------------------------------------------------------------
    -- Calculate Production Cost
    --------------------------------------------------------------------------

    v_unit_cost :=

        calculate_unit_cost(

            v_production_order_id,

            v_finished_quantity

        );

    --------------------------------------------------------------------------
    -- Receive Finished Goods
    --------------------------------------------------------------------------

    PERFORM receive_finished_goods(

        p_company_id,

        v_production_order_id,

        v_finished_item_id,

        v_warehouse_id,

        v_finished_quantity,

        v_unit_cost

    );

    --------------------------------------------------------------------------
    -- Create Accounting Journal
    --------------------------------------------------------------------------

    v_document_number :=
        generate_document_number(

            p_company_id,

            'PRODUCTION'

        );

    v_journal_id :=

        create_journal(

            p_company_id,

            'PRODUCTION',

            v_production_order_id,

            v_document_number,

            v_production_date,

            NULL,

            'Production Completion',

            p_user_id

        );

    --------------------------------------------------------------------------
    -- Accounting Entries
    --------------------------------------------------------------------------

    -- TODO
    -- Debit Finished Goods Inventory
    -- Credit WIP Inventory

    --------------------------------------------------------------------------
    -- Post Journal
    --------------------------------------------------------------------------

    PERFORM post_journal(

        v_journal_id

    );

    --------------------------------------------------------------------------
    -- Close Production Order
    --------------------------------------------------------------------------

    PERFORM close_production_order(

        v_production_order_id

    );

    --------------------------------------------------------------------------
    -- Business Event
    --------------------------------------------------------------------------

    -- TODO
    -- log_business_event()

    --------------------------------------------------------------------------
    -- Return
    --------------------------------------------------------------------------

    RETURN v_production_order_id;

END;

$$;
