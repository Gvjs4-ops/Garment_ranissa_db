/*
===============================================================================
workflow_test.sql

Purpose
-------
Basic smoke test for the Workflow Engine.

Tests:
1. Create test workflow
2. Create approval step
3. Start workflow
4. Create notification
5. Approve workflow
6. Verify final status

WARNING
-------
This creates test records in workflow tables.
Use a test company/user UUID.
===============================================================================
*/

BEGIN;

-- ============================================================================
-- TEST VALUES
-- Replace these with valid UUIDs from your database
-- ============================================================================

DO $$
DECLARE

    v_company_id UUID;
    v_user_id UUID;

    v_workflow_id UUID;
    v_step_id UUID;

    v_instance_id UUID;

    v_status TEXT;
    v_notification_count INTEGER;

BEGIN

    -- Get an existing company
    SELECT id
    INTO v_company_id
    FROM companies
    WHERE is_active = TRUE
    LIMIT 1;

    IF v_company_id IS NULL THEN
        RAISE EXCEPTION
            'No organization found. Create a test company first.';
    END IF;


    -- Use an existing user if available
    SELECT id
    INTO v_user_id
    FROM auth.users
    LIMIT 1;
    -- SELECT user_id
    -- INTO v_user_id
    -- FROM company_users
    -- WHERE company_id = v_company_id
    -- AND is_active = TRUE
    -- LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION
            'No auth user found. Create a test user first.';
    END IF;


    RAISE NOTICE 'Company: %', v_company_id;
    RAISE NOTICE 'User: %', v_user_id;


    -- ========================================================================
    -- 1. Create Test Workflow
    -- ========================================================================

    INSERT INTO workflow_definition (

        company_id,
        workflow_code,
        workflow_name,
        document_type,
        is_active,
        created_by

    )

    VALUES (

        v_company_id,
        'TEST_PO_APPROVAL',
        'Test Purchase Order Approval',
        'PURCHASE_ORDER',
        TRUE,
        v_user_id

    )

    ON CONFLICT (
        company_id,
        workflow_code
    )

    DO UPDATE SET
        is_active = TRUE

    RETURNING id
    INTO v_workflow_id;


    -- ========================================================================
    -- 2. Create Approval Step
    -- ========================================================================

    INSERT INTO workflow_step (

        workflow_definition_id,
        step_number,
        step_name,
        action_type,
        approver_user_id

    )

    VALUES (

        v_workflow_id,
        1,
        'Test Manager Approval',
        'APPROVAL',
        v_user_id

    )

    ON CONFLICT (
        workflow_definition_id,
        step_number
    )

    DO UPDATE SET
        approver_user_id = EXCLUDED.approver_user_id

    RETURNING id
    INTO v_step_id;


    -- ========================================================================
    -- 3. Start Workflow
    -- ========================================================================

    v_instance_id := start_workflow(

        v_company_id,
        'PURCHASE_ORDER',
        gen_random_uuid(),
        'TEST_PO_APPROVAL',
        v_user_id

    );


    IF v_instance_id IS NULL THEN
        RAISE EXCEPTION
            'Workflow failed to start';
    END IF;


    RAISE NOTICE
        'PASS: Workflow started: %',
        v_instance_id;


    -- ========================================================================
    -- 4. Create Notification
    -- ========================================================================

    PERFORM create_workflow_notification(
        v_instance_id
    );


    SELECT COUNT(*)
    INTO v_notification_count

    FROM workflow_notification

    WHERE workflow_instance_id = v_instance_id;


    IF v_notification_count <> 1 THEN
        RAISE EXCEPTION
            'Notification test failed. Expected 1, got %',
            v_notification_count;
    END IF;


    RAISE NOTICE
        'PASS: Notification created';


    -- ========================================================================
    -- 5. Approve Workflow
    -- ========================================================================

    PERFORM approve_workflow(

        v_instance_id,
        v_user_id,
        'Test approval'

    );


    -- ========================================================================
    -- 6. Verify Final Status
    -- ========================================================================

    SELECT status
    INTO v_status

    FROM workflow_instance

    WHERE id = v_instance_id;


    IF v_status <> 'APPROVED' THEN

        RAISE EXCEPTION
            'Workflow approval failed. Status = %',
            v_status;

    END IF;


    RAISE NOTICE
        'PASS: Workflow approved';


    RAISE NOTICE
        '========================================';

    RAISE NOTICE
        'WORKFLOW TEST PASSED';

    RAISE NOTICE
        '========================================';

END $$;

ROLLBACK;
