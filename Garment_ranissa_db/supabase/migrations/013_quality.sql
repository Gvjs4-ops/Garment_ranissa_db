BEGIN;

------------------------------------------------------------
-- DEFECT CATEGORY
------------------------------------------------------------

CREATE TABLE defect_category (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    category_code VARCHAR(30) NOT NULL,

    category_name VARCHAR(100) NOT NULL,

    description TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, category_code)

);

CREATE TRIGGER trg_defect_category_updated
BEFORE UPDATE ON defect_category
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- DEFECT MASTER
------------------------------------------------------------

CREATE TABLE defect_master (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    category_id UUID NOT NULL
        REFERENCES defect_category(id),

    defect_code VARCHAR(30) NOT NULL,

    defect_name VARCHAR(150) NOT NULL,

    severity VARCHAR(20) DEFAULT 'MINOR',

    description TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, defect_code)

);

CREATE TRIGGER trg_defect_master_updated
BEFORE UPDATE ON defect_master
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- INSPECTION PLAN
------------------------------------------------------------

CREATE TABLE inspection_plan (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    plan_code VARCHAR(50) NOT NULL,

    plan_name VARCHAR(150) NOT NULL,

    inspection_stage VARCHAR(30) NOT NULL,

    sampling_method VARCHAR(50),

    acceptance_criteria TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, plan_code)

);

CREATE TRIGGER trg_inspection_plan_updated
BEFORE UPDATE ON inspection_plan
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- QUALITY INSPECTION
------------------------------------------------------------

CREATE TABLE quality_inspection (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    inspection_plan_id UUID
        REFERENCES inspection_plan(id),

    reference_type VARCHAR(30) NOT NULL,

    reference_id UUID,

    inspection_no VARCHAR(50) NOT NULL,

    inspection_date DATE NOT NULL,

    inspector_name VARCHAR(150),

    status VARCHAR(20) DEFAULT 'PENDING',

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, inspection_no)

);

CREATE TRIGGER trg_quality_inspection_updated
BEFORE UPDATE ON quality_inspection
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- QUALITY INSPECTION ITEM
------------------------------------------------------------

CREATE TABLE quality_inspection_item (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    inspection_id UUID NOT NULL
        REFERENCES quality_inspection(id)
        ON DELETE CASCADE,

    line_no INTEGER NOT NULL,

    item_id UUID
        REFERENCES item_master(id),

    inspected_quantity NUMERIC(18,3) DEFAULT 0,

    accepted_quantity NUMERIC(18,3) DEFAULT 0,

    rejected_quantity NUMERIC(18,3) DEFAULT 0,

    defect_id UUID
        REFERENCES defect_master(id),

    remarks TEXT,

    UNIQUE(inspection_id, line_no)

);

------------------------------------------------------------
-- INDEXES
------------------------------------------------------------

CREATE INDEX idx_defect_master_category
ON defect_master(category_id);

CREATE INDEX idx_inspection_plan_stage
ON inspection_plan(inspection_stage);

CREATE INDEX idx_quality_inspection_date
ON quality_inspection(inspection_date);

CREATE INDEX idx_quality_inspection_status
ON quality_inspection(status);

CREATE INDEX idx_quality_inspection_reference
ON quality_inspection(reference_type, reference_id);

CREATE INDEX idx_quality_inspection_item_item
ON quality_inspection_item(item_id);

CREATE INDEX idx_quality_inspection_item_defect
ON quality_inspection_item(defect_id);

COMMIT;