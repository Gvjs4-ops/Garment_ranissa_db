/*
===============================================================================
024_material_planning.sql

Material Requirement Planning (MRP)

===============================================================================
*/

-- ============================================================================
-- Purchase Requisition Header
-- ============================================================================

CREATE TABLE purchase_requisition (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL REFERENCES organization(id),

    requisition_number TEXT NOT NULL,

    requisition_date DATE NOT NULL,

    required_date DATE,

    status TEXT NOT NULL DEFAULT 'OPEN',

    remarks TEXT,

    created_by UUID,

    updated_by UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE UNIQUE INDEX ux_purchase_requisition

ON purchase_requisition(

    company_id,

    requisition_number

);

-- ============================================================================
-- Purchase Requisition Line
-- ============================================================================

CREATE TABLE purchase_requisition_line (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    purchase_requisition_id UUID
        REFERENCES purchase_requisition(id)
        ON DELETE CASCADE,

    item_id UUID NOT NULL REFERENCES item_master(id),

    requested_quantity NUMERIC(18,4) NOT NULL,

    approved_quantity NUMERIC(18,4) DEFAULT 0,

    ordered_quantity NUMERIC(18,4) DEFAULT 0,

    uom_id UUID,

    source TEXT,

    reference_id UUID,

    status TEXT DEFAULT 'OPEN',

    remarks TEXT

);

-- ============================================================================
-- Material Requirement
-- ============================================================================

CREATE TABLE material_requirement (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    production_plan_line_id UUID
        REFERENCES production_plan_line(id)
        ON DELETE CASCADE,

    item_id UUID NOT NULL REFERENCES item_master(id),

    required_quantity NUMERIC(18,4) NOT NULL,

    available_quantity NUMERIC(18,4) DEFAULT 0,

    reserved_quantity NUMERIC(18,4) DEFAULT 0,

    shortage_quantity NUMERIC(18,4) DEFAULT 0,

    purchase_quantity NUMERIC(18,4) DEFAULT 0,

    issued_quantity NUMERIC(18,4) DEFAULT 0,

    status TEXT DEFAULT 'PLANNED',

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_material_requirement_plan

ON material_requirement(

    production_plan_line_id

);

CREATE INDEX idx_material_requirement_item

ON material_requirement(

    item_id

);

CREATE INDEX idx_purchase_requisition_status

ON purchase_requisition(

    status

);

CREATE INDEX idx_purchase_requisition_line_item

ON purchase_requisition_line(

    item_id

);
