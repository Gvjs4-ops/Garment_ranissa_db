/*
===============================================================================
034_workflow_engine.sql

Workflow & Approval Engine

Purpose
-------
Reusable workflow engine for ERP transactions.

Supports:
- Purchase Orders
- Sales Orders
- Production Orders
- Stock Adjustments
- Quality Inspections
- Maintenance Work Orders
- Other future documents

===============================================================================
*/

-- ============================================================================
-- Workflow Definition
-- ============================================================================

CREATE TABLE workflow_definition (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
	REFERENCES companies(id),

    workflow_code TEXT NOT NULL,

    workflow_name TEXT NOT NULL,

    document_type TEXT NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,

    created_by UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE UNIQUE INDEX ux_workflow_definition
ON workflow_definition(
    company_id,
    workflow_code
);


-- ============================================================================
-- Workflow Step
-- ============================================================================

CREATE TABLE workflow_step (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workflow_definition_id UUID NOT NULL
        REFERENCES workflow_definition(id)
        ON DELETE CASCADE,

    step_number INTEGER NOT NULL,

    step_name TEXT NOT NULL,

    action_type TEXT NOT NULL DEFAULT 'APPROVAL',

    approver_role TEXT,

    approver_user_id UUID,

    minimum_approvals INTEGER DEFAULT 1,

    is_mandatory BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE UNIQUE INDEX ux_workflow_step
ON workflow_step(
    workflow_definition_id,
    step_number
);


-- ============================================================================
-- Workflow Instance
-- ============================================================================

CREATE TABLE workflow_instance (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workflow_definition_id UUID NOT NULL
        REFERENCES workflow_definition(id),

    company_id UUID NOT NULL
	REFERENCES companies(id),

    document_type TEXT NOT NULL,

    document_id UUID NOT NULL,

    current_step_number INTEGER DEFAULT 1,

    status TEXT DEFAULT 'PENDING',

    initiated_by UUID,

    started_at TIMESTAMPTZ DEFAULT NOW(),

    completed_at TIMESTAMPTZ,

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE INDEX idx_workflow_instance_document
ON workflow_instance(
    document_type,
    document_id
);

CREATE INDEX idx_workflow_instance_status
ON workflow_instance(status);


-- ============================================================================
-- Workflow Action / History
-- ============================================================================

CREATE TABLE workflow_action (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workflow_instance_id UUID NOT NULL
        REFERENCES workflow_instance(id)
        ON DELETE CASCADE,

    workflow_step_id UUID
        REFERENCES workflow_step(id),

    action TEXT NOT NULL,

    action_by UUID,

    comments TEXT,

    action_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE INDEX idx_workflow_action_instance
ON workflow_action(workflow_instance_id);


-- ============================================================================
-- Workflow Notification
-- ============================================================================

CREATE TABLE workflow_notification (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workflow_instance_id UUID NOT NULL
        REFERENCES workflow_instance(id)
        ON DELETE CASCADE,

    workflow_step_id UUID
        REFERENCES workflow_step(id),

    recipient_user_id UUID,

    notification_type TEXT DEFAULT 'APPROVAL_REQUIRED',

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    read_at TIMESTAMPTZ

);

CREATE INDEX idx_workflow_notification_user
ON workflow_notification(recipient_user_id);

CREATE INDEX idx_workflow_notification_unread
ON workflow_notification(
    recipient_user_id,
    is_read
);
