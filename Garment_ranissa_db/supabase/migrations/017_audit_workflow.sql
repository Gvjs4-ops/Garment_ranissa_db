BEGIN;

------------------------------------------------------------
-- APPROVAL WORKFLOW
------------------------------------------------------------

CREATE TABLE approval_workflow (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    workflow_code VARCHAR(30) NOT NULL,

    workflow_name VARCHAR(150) NOT NULL,

    document_type VARCHAR(50) NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, workflow_code)

);

CREATE TRIGGER trg_approval_workflow_updated
BEFORE UPDATE ON approval_workflow
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- APPROVAL WORKFLOW STEP
------------------------------------------------------------

CREATE TABLE approval_workflow_step (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workflow_id UUID NOT NULL
        REFERENCES approval_workflow(id)
        ON DELETE CASCADE,

    step_no INTEGER NOT NULL,

    role_name VARCHAR(100) NOT NULL,

    minimum_amount NUMERIC(18,2),

    maximum_amount NUMERIC(18,2),

    is_final_step BOOLEAN DEFAULT FALSE,

    UNIQUE(workflow_id, step_no)

);

------------------------------------------------------------
-- DOCUMENT APPROVAL
------------------------------------------------------------

CREATE TABLE document_approval (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    workflow_id UUID
        REFERENCES approval_workflow(id),

    document_type VARCHAR(50) NOT NULL,

    document_id UUID NOT NULL,

    current_step INTEGER DEFAULT 1,

    status VARCHAR(20) DEFAULT 'PENDING',

    requested_by UUID,

    requested_at TIMESTAMPTZ DEFAULT NOW(),

    completed_at TIMESTAMPTZ

);

------------------------------------------------------------
-- DOCUMENT APPROVAL HISTORY
------------------------------------------------------------

CREATE TABLE document_approval_history (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_approval_id UUID NOT NULL
        REFERENCES document_approval(id)
        ON DELETE CASCADE,

    step_no INTEGER NOT NULL,

    action VARCHAR(20) NOT NULL,

    action_by UUID,

    action_at TIMESTAMPTZ DEFAULT NOW(),

    comments TEXT

);

------------------------------------------------------------
-- AUDIT LOG
------------------------------------------------------------

CREATE TABLE audit_log (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID
        REFERENCES company(id)
        ON DELETE CASCADE,

    table_name VARCHAR(100) NOT NULL,

    record_id UUID NOT NULL,

    operation VARCHAR(20) NOT NULL,

    old_data JSONB,

    new_data JSONB,

    changed_by UUID,

    changed_at TIMESTAMPTZ DEFAULT NOW(),

    ip_address INET,

    user_agent TEXT

);

------------------------------------------------------------
-- INDEXES
------------------------------------------------------------

CREATE INDEX idx_workflow_document
ON approval_workflow(document_type);

CREATE INDEX idx_document_approval_status
ON document_approval(status);

CREATE INDEX idx_document_approval_document
ON document_approval(document_type, document_id);

CREATE INDEX idx_approval_history_document
ON document_approval_history(document_approval_id);

CREATE INDEX idx_audit_table
ON audit_log(table_name);

CREATE INDEX idx_audit_record
ON audit_log(record_id);

CREATE INDEX idx_audit_changed_at
ON audit_log(changed_at);

COMMIT;