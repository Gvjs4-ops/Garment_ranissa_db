/*
===============================================================================
021_platform_administration.sql
Platform Administration & Remote Support Infrastructure
===============================================================================
*/

-- ============================================================================
-- Platform Accounts
-- ============================================================================

CREATE TABLE platform_account (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email TEXT NOT NULL UNIQUE,

    full_name TEXT NOT NULL,

    role TEXT NOT NULL
        CHECK (
            role IN (
                'SUPER_ADMIN',
                'SUPPORT_ENGINEER',
                'CONSULTANT',
                'DEVELOPER'
            )
        ),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

);

-- ============================================================================
-- Customer Consent
-- ============================================================================

CREATE TABLE platform_consent (

    company_id UUID PRIMARY KEY
        REFERENCES organization(id),

    allow_remote_support BOOLEAN NOT NULL DEFAULT FALSE,

    allow_usage_statistics BOOLEAN NOT NULL DEFAULT FALSE,

    allow_anonymous_benchmarking BOOLEAN NOT NULL DEFAULT FALSE,

    allow_product_improvements BOOLEAN NOT NULL DEFAULT FALSE,

    last_updated_at TIMESTAMPTZ
        NOT NULL DEFAULT now()

);

-- ============================================================================
-- Support Sessions
-- ============================================================================

CREATE TABLE customer_support_session (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    platform_account_id UUID NOT NULL
        REFERENCES platform_account(id),

    requested_by UUID,

    approved_by UUID,

    reason TEXT,

    status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (
            status IN (
                'ACTIVE',
                'EXPIRED',
                'CLOSED'
            )
        ),

    started_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    expires_at TIMESTAMPTZ NOT NULL,

    ended_at TIMESTAMPTZ

);

-- ============================================================================
-- Support Audit
-- ============================================================================

CREATE TABLE customer_support_audit (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    support_session_id UUID
        REFERENCES customer_support_session(id),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    platform_account_id UUID
        REFERENCES platform_account(id),

    module_name TEXT,

    action_name TEXT,

    document_type TEXT,

    document_id UUID,

    remarks TEXT,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now()

);

-- ============================================================================
-- System Health Snapshot
-- ============================================================================

CREATE TABLE system_health_log (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    application_version TEXT,

    database_size_mb NUMERIC(12,2),

    storage_size_mb NUMERIC(12,2),

    active_users INTEGER,

    api_calls INTEGER,

    error_count INTEGER,

    snapshot_time TIMESTAMPTZ
        NOT NULL DEFAULT now()

);

-- ============================================================================
-- Improvement Recommendations
-- ============================================================================

CREATE TABLE improvement_recommendation (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    category TEXT,

    priority TEXT
        CHECK (
            priority IN (
                'LOW',
                'MEDIUM',
                'HIGH',
                'CRITICAL'
            )
        ),

    title TEXT NOT NULL,

    description TEXT,

    status TEXT NOT NULL DEFAULT 'OPEN'
        CHECK (
            status IN (
                'OPEN',
                'ACKNOWLEDGED',
                'IMPLEMENTED',
                'IGNORED'
            )
        ),

    generated_by TEXT DEFAULT 'SYSTEM',

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT now(),

    resolved_at TIMESTAMPTZ

);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_support_company
ON customer_support_session(company_id);

CREATE INDEX idx_support_status
ON customer_support_session(status);

CREATE INDEX idx_support_audit_company
ON customer_support_audit(company_id);

CREATE INDEX idx_health_company
ON system_health_log(company_id);

CREATE INDEX idx_recommendation_company
ON improvement_recommendation(company_id);
