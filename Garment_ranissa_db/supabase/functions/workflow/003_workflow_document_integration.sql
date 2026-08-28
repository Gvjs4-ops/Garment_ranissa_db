/*
===============================================================================
003_workflow_document_integration.sql

Purpose
-------
Connect the generic Workflow Engine to ERP documents.

Initial integrations:
- Purchase Orders
- Sales Orders
- Production Orders
- Quality Inspections
- Maintenance Work Orders

The workflow engine remains generic. These functions simply start and
complete workflows for specific ERP documents.

===============================================================================
*/


-- ============================================================================
-- Start Purchase Order Workflow
-- ============================================================================

CREATE OR REPLACE FUNCTION start_purchase_order_workflow(

    p_company_id UUID,
    p_purchase_order_id UUID,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE
    v_workflow_instance_id UUID;

BEGIN

    v_workflow_instance_id := start_workflow(

        p_company_id,
        'PURCHASE_ORDER',
        p_purchase_order_id,
        'PURCHASE_ORDER_APPROVAL',
        p_user_id

    );

    PERFORM create_workflow_notification(
        v_workflow_instance_id
    );

    RETURN v_workflow_instance_id;

END;

$$;


-- ============================================================================
-- Start Sales Order Workflow
-- ============================================================================

CREATE OR REPLACE FUNCTION start_sales_order_workflow(

    p_company_id UUID,
    p_sales_order_id UUID,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE
    v_workflow_instance_id UUID;

BEGIN

    v_workflow_instance_id := start_workflow(

        p_company_id,
        'SALES_ORDER',
        p_sales_order_id,
        'SALES_ORDER_APPROVAL',
        p_user_id

    );

    PERFORM create_workflow_notification(
        v_workflow_instance_id
    );

    RETURN v_workflow_instance_id;

END;

$$;


-- ============================================================================
-- Start Production Order Workflow
-- ============================================================================

CREATE OR REPLACE FUNCTION start_production_order_workflow(

    p_company_id UUID,
    p_production_order_id UUID,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE
    v_workflow_instance_id UUID;

BEGIN

    v_workflow_instance_id := start_workflow(

        p_company_id,
        'PRODUCTION_ORDER',
        p_production_order_id,
        'PRODUCTION_ORDER_APPROVAL',
        p_user_id

    );

    PERFORM create_workflow_notification(
        v_workflow_instance_id
    );

    RETURN v_workflow_instance_id;

END;

$$;


-- ============================================================================
-- Start Quality Inspection Workflow
-- ============================================================================

CREATE OR REPLACE FUNCTION start_quality_workflow(

    p_company_id UUID,
    p_quality_inspection_id UUID,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE
    v_workflow_instance_id UUID;

BEGIN

    v_workflow_instance_id := start_workflow(

        p_company_id,
        'QUALITY_INSPECTION',
        p_quality_inspection_id,
        'QUALITY_INSPECTION_APPROVAL',
        p_user_id

    );

    PERFORM create_workflow_notification(
        v_workflow_instance_id
    );

    RETURN v_workflow_instance_id;

END;

$$;


-- ============================================================================
-- Start Maintenance Work Order Workflow
-- ============================================================================

CREATE OR REPLACE FUNCTION start_maintenance_workflow(

    p_company_id UUID,
    p_work_order_id UUID,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE
    v_workflow_instance_id UUID;

BEGIN

    v_workflow_instance_id := start_workflow(

        p_company_id,
        'MAINTENANCE_WORK_ORDER',
        p_work_order_id,
        'MAINTENANCE_WORK_ORDER_APPROVAL',
        p_user_id

    );

    PERFORM create_workflow_notification(
        v_workflow_instance_id
    );

    RETURN v_workflow_instance_id;

END;

$$;


-- ============================================================================
-- Get Document Workflow Status
-- ============================================================================

CREATE OR REPLACE FUNCTION get_document_workflow_status(

    p_document_type TEXT,
    p_document_id UUID

)

RETURNS TABLE (

    workflow_instance_id UUID,
    workflow_status TEXT,
    current_step INTEGER,
    step_name TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ

)

LANGUAGE plpgsql

AS
$$

BEGIN

    RETURN QUERY

    SELECT

        wi.id,

        wi.status,

        wi.current_step_number,

        ws.step_name,

        wi.started_at,

        wi.completed_at

    FROM workflow_instance wi

    LEFT JOIN workflow_step ws

        ON ws.workflow_definition_id =
           wi.workflow_definition_id

       AND ws.step_number =
           wi.current_step_number

    WHERE wi.document_type = p_document_type

      AND wi.document_id = p_document_id

    ORDER BY wi.started_at DESC

    LIMIT 1;

END;

$$;
