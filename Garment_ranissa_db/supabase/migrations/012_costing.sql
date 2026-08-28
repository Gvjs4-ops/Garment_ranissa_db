BEGIN;

------------------------------------------------------------
-- COST COMPONENT
------------------------------------------------------------

CREATE TABLE cost_component (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    component_code VARCHAR(30) NOT NULL,

    component_name VARCHAR(100) NOT NULL,

    component_type VARCHAR(30) NOT NULL,

    description TEXT,

    display_order INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, component_code)

);

CREATE TRIGGER trg_cost_component_updated
BEFORE UPDATE ON cost_component
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- COST SHEET
------------------------------------------------------------

CREATE TABLE cost_sheet (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    style_version_id UUID NOT NULL
        REFERENCES style_version(id),

    cost_sheet_no VARCHAR(50) NOT NULL,

    revision_no INTEGER DEFAULT 1,

    effective_from DATE,

    status VARCHAR(20) DEFAULT 'DRAFT',

    currency_code VARCHAR(10) DEFAULT 'INR',

    total_material_cost NUMERIC(18,4) DEFAULT 0,

    total_labor_cost NUMERIC(18,4) DEFAULT 0,

    total_overhead_cost NUMERIC(18,4) DEFAULT 0,

    total_other_cost NUMERIC(18,4) DEFAULT 0,

    total_cost NUMERIC(18,4) DEFAULT 0,

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, cost_sheet_no, revision_no)

);

CREATE TRIGGER trg_cost_sheet_updated
BEFORE UPDATE ON cost_sheet
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- COST SHEET ITEM
------------------------------------------------------------

CREATE TABLE cost_sheet_item (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cost_sheet_id UUID NOT NULL
        REFERENCES cost_sheet(id)
        ON DELETE CASCADE,

    line_no INTEGER NOT NULL,

    component_id UUID NOT NULL
        REFERENCES cost_component(id),

    item_id UUID
        REFERENCES item_master(id),

    description TEXT,

    quantity NUMERIC(18,4) DEFAULT 1,

    rate NUMERIC(18,4) DEFAULT 0,

    amount NUMERIC(18,4) DEFAULT 0,

    remarks TEXT,

    UNIQUE(cost_sheet_id, line_no)

);

------------------------------------------------------------
-- LABOR RATE
------------------------------------------------------------

CREATE TABLE labor_rate (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    operation_name VARCHAR(150) NOT NULL,

    rate_per_hour NUMERIC(18,4) NOT NULL,

    effective_from DATE NOT NULL,

    effective_to DATE,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_labor_rate_updated
BEFORE UPDATE ON labor_rate
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- OVERHEAD RATE
------------------------------------------------------------

CREATE TABLE overhead_rate (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    overhead_name VARCHAR(150) NOT NULL,

    rate_type VARCHAR(30) NOT NULL,

    rate NUMERIC(18,4) NOT NULL,

    effective_from DATE NOT NULL,

    effective_to DATE,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_overhead_rate_updated
BEFORE UPDATE ON overhead_rate
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- INDEXES
------------------------------------------------------------

CREATE INDEX idx_cost_sheet_style
ON cost_sheet(style_version_id);

CREATE INDEX idx_cost_sheet_status
ON cost_sheet(status);

CREATE INDEX idx_cost_sheet_item_sheet
ON cost_sheet_item(cost_sheet_id);

CREATE INDEX idx_cost_sheet_item_component
ON cost_sheet_item(component_id);

CREATE INDEX idx_cost_sheet_item_item
ON cost_sheet_item(item_id);

COMMIT;