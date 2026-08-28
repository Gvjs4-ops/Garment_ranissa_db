/*
===============================================================================
031_quality_management.sql

Quality Management System (QMS)

Purpose
-------
Industry-independent Quality Management

Supports

• Incoming Inspection
• In-Process Inspection
• Final Inspection
• Dispatch Inspection
• Supplier Quality
• Customer Complaint
• CAPA

===============================================================================
*/

-- ============================================================================
-- Inspection Type
-- ============================================================================

CREATE TABLE quality_inspection_type (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    inspection_code TEXT NOT NULL,

    inspection_name TEXT NOT NULL,

    inspection_stage TEXT NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE UNIQUE INDEX ux_quality_inspection_type

ON quality_inspection_type(

    company_id,

    inspection_code

);

-- ============================================================================
-- Quality Inspection
-- ============================================================================

CREATE TABLE quality_inspection (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    inspection_number TEXT NOT NULL,

    inspection_type_id UUID NOT NULL
        REFERENCES quality_inspection_type(id),

    inspection_date DATE NOT NULL,

    reference_document_type TEXT,

    reference_document_id UUID,

    business_partner_id UUID,

    warehouse_id UUID,

    production_order_id UUID,

    inspector_id UUID,

    status TEXT DEFAULT 'OPEN',

    overall_result TEXT,

    remarks TEXT,

    created_by UUID,

    updated_by UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE UNIQUE INDEX ux_quality_inspection

ON quality_inspection(

    company_id,

    inspection_number

);

-- ============================================================================
-- Inspection Line
-- ============================================================================

CREATE TABLE quality_inspection_line (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    quality_inspection_id UUID NOT NULL
        REFERENCES quality_inspection(id)
        ON DELETE CASCADE,

    item_id UUID
        REFERENCES item_master(id),

    inspection_parameter TEXT NOT NULL,

    specification TEXT,

    observed_value TEXT,

    result TEXT,

    remarks TEXT

);

-- ============================================================================
-- Defect Master
-- ============================================================================

CREATE TABLE quality_defect (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    defect_code TEXT NOT NULL,

    defect_name TEXT NOT NULL,

    severity TEXT,

    description TEXT,

    is_active BOOLEAN DEFAULT TRUE

);

CREATE UNIQUE INDEX ux_quality_defect

ON quality_defect(

    company_id,

    defect_code

);

-- ============================================================================
-- Inspection Defect
-- ============================================================================

CREATE TABLE quality_inspection_defect (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    quality_inspection_line_id UUID NOT NULL
        REFERENCES quality_inspection_line(id)
        ON DELETE CASCADE,

    defect_id UUID NOT NULL
        REFERENCES quality_defect(id),

    quantity NUMERIC(18,4),

    remarks TEXT

);

-- ============================================================================
-- Corrective Action (CAPA)
-- ============================================================================

CREATE TABLE corrective_action (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    capa_number TEXT NOT NULL,

    quality_inspection_id UUID
        REFERENCES quality_inspection(id),

    defect_id UUID
        REFERENCES quality_defect(id),

    root_cause TEXT,

    corrective_action TEXT,

    preventive_action TEXT,

    assigned_to UUID,

    target_date DATE,

    completion_date DATE,

    status TEXT DEFAULT 'OPEN',

    created_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE UNIQUE INDEX ux_corrective_action

ON corrective_action(

    company_id,

    capa_number

);

-- ============================================================================
-- Quality Attachment
-- ============================================================================

CREATE TABLE quality_attachment (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    quality_inspection_id UUID
        REFERENCES quality_inspection(id)
        ON DELETE CASCADE,

    file_name TEXT,

    file_path TEXT,

    mime_type TEXT,

    uploaded_by UUID,

    uploaded_at TIMESTAMPTZ DEFAULT NOW()

);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_quality_inspection_status
ON quality_inspection(status);

CREATE INDEX idx_quality_inspection_date
ON quality_inspection(inspection_date);

CREATE INDEX idx_quality_line_inspection
ON quality_inspection_line(quality_inspection_id);

CREATE INDEX idx_quality_defect
ON quality_inspection_defect(defect_id);

CREATE INDEX idx_capa_status
ON corrective_action(status);
