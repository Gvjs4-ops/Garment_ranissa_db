/*
===============================================================================
002_workflow_notifications.sql

Workflow Notification Engine

Responsibilities
----------------
- Notify current approver
- Create notification when workflow advances
- Mark notification as read
- Avoid duplicate pending notifications
===============================================================================
*/

-- ============================================================================
-- Create Notification for Current Workflow Step
-- ============================================================================

CREATE OR REPLACE FUNCTION create_workflow_notification(
    p_workflow_instance_id UUID
)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE
    v_notification_id UUID;
    v_step_id UUID;
    v_approver_user_id UUID;
BEGIN

    SELECT
        ws.id,
        ws.approver_user_id
    INTO
        v_step_id,
        v_approver_user_id
    FROM workflow_instance wi

    JOIN workflow_step ws
        ON ws.workflow_definition_id = wi.workflow_definition_id
       AND ws.step_number = wi.current_step_number

    WHERE wi.id = p_workflow_instance_id
      AND wi.status = 'PENDING';

    IF v_step_id IS NULL THEN
        RAISE EXCEPTION 'No active workflow step found';
    END IF;

    IF v_approver_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Prevent duplicate unread notifications
    IF EXISTS (
        SELECT 1
        FROM workflow_notification
        WHERE workflow_instance_id = p_workflow_instance_id
          AND workflow_step_id = v_step_id
          AND recipient_user_id = v_approver_user_id
          AND is_read = FALSE
    ) THEN
        RETURN NULL;
    END IF;

    INSERT INTO workflow_notification (
        workflow_instance_id,
        workflow_step_id,
        recipient_user_id,
        notification_type
    )

    VALUES (
        p_workflow_instance_id,
        v_step_id,
        v_approver_user_id,
        'APPROVAL_REQUIRED'
    )

    RETURNING id
    INTO v_notification_id;

    RETURN v_notification_id;

END;

$$;


-- ============================================================================
-- Notify Next Approver
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_next_workflow_step(
    p_workflow_instance_id UUID
)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

BEGIN

    RETURN create_workflow_notification(
        p_workflow_instance_id
    );

END;

$$;


-- ============================================================================
-- Mark Notification as Read
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_workflow_notification_read(
    p_notification_id UUID,
    p_user_id UUID
)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE workflow_notification

    SET
        is_read = TRUE,
        read_at = NOW()

    WHERE id = p_notification_id
      AND recipient_user_id = p_user_id;

END;

$$;


-- ============================================================================
-- Mark All Notifications as Read
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_all_workflow_notifications_read(
    p_user_id UUID
)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE workflow_notification

    SET
        is_read = TRUE,
        read_at = NOW()

    WHERE recipient_user_id = p_user_id
      AND is_read = FALSE;

END;

$$;


-- ============================================================================
-- Get Pending Notifications
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pending_workflow_notifications(
    p_user_id UUID
)

RETURNS TABLE (

    notification_id UUID,
    workflow_instance_id UUID,
    document_type TEXT,
    document_id UUID,
    step_name TEXT,
    notification_type TEXT,
    created_at TIMESTAMPTZ

)

LANGUAGE plpgsql

AS
$$

BEGIN

    RETURN QUERY

    SELECT

        wn.id,
        wn.workflow_instance_id,
        wi.document_type,
        wi.document_id,
        ws.step_name,
        wn.notification_type,
        wn.created_at

    FROM workflow_notification wn

    JOIN workflow_instance wi
        ON wi.id = wn.workflow_instance_id

    JOIN workflow_step ws
        ON ws.id = wn.workflow_step_id

    WHERE wn.recipient_user_id = p_user_id
      AND wn.is_read = FALSE
      AND wi.status = 'PENDING'

    ORDER BY wn.created_at DESC;

END;

$$;
