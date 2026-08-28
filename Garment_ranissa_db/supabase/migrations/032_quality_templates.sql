/*
===============================================================================
032_quality_templates.sql

Quality Inspection Templates

Purpose
-------
Configurable inspection templates for different inspection stages.

===============================================================================
*/

-- ============================================================================
-- Quality Template
-- ============================================================================

CREATE TABLE quality_template (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    template_code TEXT NOT NULL,

    template_name TEXT NOT NULL,

    inspection_type_id UUID NOT NULL
        REFERENCES quality_inspection_type(id),

    is_active BOOLEAN DEFAULT TRUE,

    remarks TEXT,

    created_by UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE UNIQUE INDEX ux_quality_template

ON quality_template(

    company_id,

    template_code

);

-- ============================================================================
-- Quality Template Parameter
-- ============================================================================

CREATE TABLE quality_template_parameter (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    quality_template_id UUID NOT NULL
        REFERENCES quality_template(id)
        ON DELETE CASCADE,

    sequence_no INTEGER NOT NULL,

    parameter_name TEXT NOT NULL,

    specification TEXT,

    unit TEXT,

    mandatory BOOLEAN DEFAULT TRUE,

    pass_value TEXT,

    fail_value TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE INDEX idx_quality_template_parameter

ON quality_template_parameter(

    quality_template_id,

    sequence_no

);
