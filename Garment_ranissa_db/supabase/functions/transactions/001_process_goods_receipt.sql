/*
===============================================================================
001_process_goods_receipt.sql

Purpose:
    Process a complete Goods Receipt transaction atomically.

Responsibilities:
    - Validate document
    - Generate GRN Number
    - Create Goods Receipt
    - Create Goods Receipt Lines
    - Update Purchase Order
    - Update Inventory
    - Update Average Cost
    - Create Accounting Entries
    - Log Business Event

Author:
    Garment Ranissa ERP
===============================================================================
*/

CREATE OR REPLACE FUNCTION process_goods_receipt(

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

    v_goods_receipt_id UUID;

    v_purchase_order_id UUID;

    v_supplier_id UUID;

    v_warehouse_id UUID;

    v_receipt_date DATE;

    v_document_number TEXT;

    v_remarks TEXT;

    --------------------------------------------------------------------------
    -- Item Loop
    --------------------------------------------------------------------------

    v_item JSONB;

BEGIN

    --------------------------------------------------------------------------
    -- Extract Header
    --------------------------------------------------------------------------

    v_purchase_order_id :=
        (p_document->>'purchaseOrderId')::UUID;

    v_supplier_id :=
        (p_document->>'supplierId')::UUID;

    v_warehouse_id :=
        (p_document->>'warehouseId')::UUID;

    v_receipt_date :=
        (p_document->>'receiptDate')::DATE;

    v_remarks :=
        p_document->>'remarks';

    --------------------------------------------------------------------------
    -- Validation
    --------------------------------------------------------------------------

    -- TODO
    -- Validate Company
    -- Validate Supplier
    -- Validate Warehouse
    -- Validate Purchase Order
    -- Validate PO Status

    --------------------------------------------------------------------------
    -- Generate GRN Number
    --------------------------------------------------------------------------

    v_document_number :=
        generate_document_number(
            p_company_id,
            'GOODS_RECEIPT'
        );

    --------------------------------------------------------------------------
    -- Create Header
    --------------------------------------------------------------------------

    INSERT INTO goods_receipt (

        company_id,

        purchase_order_id,

        supplier_id,

        warehouse_id,

        receipt_number,

        receipt_date,

        remarks,

        created_by

    )

    VALUES (

        p_company_id,

        v_purchase_order_id,

        v_supplier_id,

        v_warehouse_id,

        v_document_number,

        v_receipt_date,

        v_remarks,

        p_user_id

    )

    RETURNING id

    INTO v_goods_receipt_id;

    --------------------------------------------------------------------------
    -- Process Items
    --------------------------------------------------------------------------

    FOR v_item IN

        SELECT *

        FROM jsonb_array_elements(
            p_document->'items'
        )

    LOOP

        --------------------------------------------------------------
        -- Insert Receipt Line
        --------------------------------------------------------------

        INSERT INTO goods_receipt_item (

            goods_receipt_id,

            item_id,

            received_quantity,

            unit_cost,

            remarks

        )

        VALUES (

            v_goods_receipt_id,

            (v_item->>'itemId')::UUID,

            (v_item->>'quantity')::NUMERIC,

            (v_item->>'unitCost')::NUMERIC,

            v_item->>'remarks'

        );

        --------------------------------------------------------------
        -- Update Inventory
        --------------------------------------------------------------

        PERFORM inventory_in(

            p_company_id,

            v_warehouse_id,

            (v_item->>'itemId')::UUID,

            (v_item->>'quantity')::NUMERIC,

            (v_item->>'unitCost')::NUMERIC,

            'GOODS_RECEIPT',

            v_goods_receipt_id

        );

    END LOOP;

    --------------------------------------------------------------------------
    -- Update Purchase Order
    --------------------------------------------------------------------------

    -- TODO
    -- Update received quantity
    -- Update line status
    -- Update document status

    --------------------------------------------------------------------------
    -- Update Cost
    --------------------------------------------------------------------------

    -- TODO
    -- Recalculate weighted average cost

    --------------------------------------------------------------------------
    -- Accounting
    --------------------------------------------------------------------------

    -- TODO
    -- Debit Inventory
    -- Credit GRNI / Supplier

    --------------------------------------------------------------------------
    -- Business Event
    --------------------------------------------------------------------------

    -- TODO
    -- log_business_event()

    --------------------------------------------------------------------------
    -- Return Document
    --------------------------------------------------------------------------

    RETURN v_goods_receipt_id;

END;

$$;
