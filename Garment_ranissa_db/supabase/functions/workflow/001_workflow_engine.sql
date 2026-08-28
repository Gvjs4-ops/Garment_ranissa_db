/*
===============================================================================
001_workflow_engine.sql

Workflow Execution Engine

Responsibilities
----------------
- Start Workflow
- Get Current Step
- Approve Workflow
- Reject Workflow
- Advance Workflow
- Complete Workflow
- Cancel Workflow

===============================================================================
*/

-- ============================================================================
-- Start Workflow
-- ============================================================================

CREATE OR REPLACE FUNCTION start_workflow(

    p_company_id UUID,
    p_document_type TEXT,
    p_document_id UUID,
    p_workflow_code TEXT,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_workflow_id UUID;
    v_instance_id UUID;

BEGIN

    SELECT id
    INTO v_workflow_id

    FROM workflow_definition

    WHERE company_id = p_company_id

      AND workflow_code = p_workflow_code

      AND is_active = TRUE

    LIMIT 1;

    IF v_workflow_id IS NULL THEN

        RAISE EXCEPTION
            'Active workflow not found: %',
            p_workflow_code;

    END IF;

    INSERT INTO workflow_instance(

        workflow_definition_id,
        company_id,
        document_type,
        document_id,
        current_step_number,
        status,
        initiated_by

    )

    VALUES(

        v_workflow_id,
        p_company_id,
        p_document_type,
        p_document_id,
        1,
        'PENDING',
        p_user_id

    )

    RETURNING id
    INTO v_instance_id;

    RETURN v_instance_id;

END;

$$;


-- ============================================================================
-- Approve Workflow
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_workflow(

    p_workflow_instance_id UUID,
    p_user_id UUID,
    p_comments TEXT DEFAULT NULL

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_step_id UUID;
    v_step_number INTEGER;
    v_last_step INTEGER;

BEGIN

    SELECT

        wi.current_step_number,

        ws.id

    INTO

        v_step_number,

        v_step_id

    FROM workflow_instance wi

    JOIN workflow_step ws

        ON ws.workflow_definition_id =
           wi.workflow_definition_id

       AND ws.step_number =
           wi.current_step_number

    WHERE wi.id = p_workflow_instance_id

      AND wi.status = 'PENDING';

    IF v_step_id IS NULL THEN

        RAISE EXCEPTION
            'No active workflow step found';

    END IF;


    -- Record approval

    INSERT INTO workflow_action(

        workflow_instance_id,
        workflow_step_id,
        action,
        action_by,
        comments

    )

    VALUES(

        p_workflow_instance_id,
        v_step_id,
        'APPROVED',
        p_user_id,
        p_comments

    );


    -- Find final step

    SELECT MAX(step_number)

    INTO v_last_step

    FROM workflow_step

    WHERE workflow_definition_id = (

        SELECT workflow_definition_id

        FROM workflow_instance

        WHERE id = p_workflow_instance_id

    );


    IF v_step_number >= v_last_step THEN

        UPDATE workflow_instance

        SET

            status = 'APPROVED',

            completed_at = NOW(),

            updated_at = NOW()

        WHERE id = p_workflow_instance_id;

    ELSE

        UPDATE workflow_instance

        SET

            current_step_number =
                current_step_number + 1,

            updated_at = NOW()

        WHERE id = p_workflow_instance_id;

    END IF;

END;

$$;


-- ============================================================================
-- Reject Workflow
-- ============================================================================

CREATE OR REPLACE FUNCTION reject_workflow(

    p_workflow_instance_id UUID,
    p_user_id UUID,
    p_comments TEXT DEFAULT NULL

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_step_id UUID;

BEGIN

    SELECT ws.id

    INTO v_step_id

    FROM workflow_instance wi

    JOIN workflow_step ws

        ON ws.workflow_definition_id =
           wi.workflow_definition_id

       AND ws.step_number =
           wi.current_step_number

    WHERE wi.id = p_workflow_instance_id

      AND wi.status = 'PENDING';

    IF v_step_id IS NULL THEN

        RAISE EXCEPTION
            'No active workflow step found';

    END IF;


    INSERT INTO workflow_action(

        workflow_instance_id,
        workflow_step_id,
        action,
        action_by,
        comments

    )

    VALUES(

        p_workflow_instance_id,
        v_step_id,
        'REJECTED',
        p_user_id,
        p_comments

    );


    UPDATE workflow_instance

    SET

        status = 'REJECTED',

        completed_at = NOW(),

        updated_at = NOW()

    WHERE id = p_workflow_instance_id;

END;

$$;


-- ============================================================================
-- Cancel Workflow
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_workflow(

    p_workflow_instance_id UUID,
    p_user_id UUID,
    p_comments TEXT DEFAULT NULL

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    INSERT INTO workflow_action(

        workflow_instance_id,
        action,
        action_by,
        comments

    )

    VALUES(

        p_workflow_instance_id,
        'CANCELLED',
        p_user_id,
        p_comments

    );


    UPDATE workflow_instance

    SET

        status = 'CANCELLED',

        completed_at = NOW(),

        updated_at = NOW()

    WHERE id = p_workflow_instance_id

      AND status = 'PENDING';

END;

$$;


-- ============================================================================
-- Get Current Workflow Step
-- ============================================================================

CREATE OR REPLACE FUNCTION get_workflow_current_step(

    p_workflow_instance_id UUID

)

RETURNS TABLE (

    step_id UUID,

    step_number INTEGER,

    step_name TEXT,

    action_type TEXT,

    approver_role TEXT,

    approver_user_id UUID

)

LANGUAGE plpgsql

AS
$$

BEGIN

    RETURN QUERY

    SELECT

        ws.id,

        ws.step_number,

        ws.step_name,

        ws.action_type,

        ws.approver_role,

        ws.approver_user_id

    FROM workflow_instance wi

    JOIN workflow_step ws

        ON ws.workflow_definition_id =
           wi.workflow_definition_id

       AND ws.step_number =
           wi.current_step_number

    WHERE wi.id = p_workflow_instance_id;

END;

$$;
