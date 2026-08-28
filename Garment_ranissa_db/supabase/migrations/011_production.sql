BEGIN;

------------------------------------------------------------
-- PRODUCTION ORDER
------------------------------------------------------------

CREATE TABLE production_order (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    production_number VARCHAR(50) NOT NULL,

    style_variant_id UUID NOT NULL
        REFERENCES style_variant(id),

    bom_id UUID NOT NULL
        REFERENCES bill_of_material(id),

    warehouse_id UUID NOT NULL
        REFERENCES warehouse(id),

    planned_quantity NUMERIC(18,3) NOT NULL,

    completed_quantity NUMERIC(18,3) DEFAULT 0,

    production_date DATE NOT NULL,

    status VARCHAR(20) DEFAULT 'PLANNED',

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, production_number)

);

CREATE TRIGGER trg_production_order_updated
BEFORE UPDATE ON production_order
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- PRODUCTION ORDER ITEM
------------------------------------------------------------

CREATE TABLE production_order_item (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    production_order_id UUID NOT NULL
        REFERENCES production_order(id)
        ON DELETE CASCADE,

    line_no INTEGER NOT NULL,

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    planned_quantity NUMERIC(18,3) NOT NULL,

    issued_quantity NUMERIC(18,3) DEFAULT 0,

    consumed_quantity NUMERIC(18,3) DEFAULT 0,

    UNIQUE(production_order_id, line_no)

);

------------------------------------------------------------
-- PRODUCTION MATERIAL ISSUE
------------------------------------------------------------

CREATE TABLE production_material_issue (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    production_order_id UUID NOT NULL
        REFERENCES production_order(id),

    issue_number VARCHAR(50) NOT NULL,

    issue_date DATE NOT NULL,

    warehouse_id UUID NOT NULL
        REFERENCES warehouse(id),

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, issue_number)

);

CREATE TRIGGER trg_production_material_issue_updated
BEFORE UPDATE ON production_material_issue
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- PRODUCTION MATERIAL ISSUE ITEM
------------------------------------------------------------

CREATE TABLE production_material_issue_item (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    production_material_issue_id UUID NOT NULL
        REFERENCES production_material_issue(id)
        ON DELETE CASCADE,

    line_no INTEGER NOT NULL,

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    quantity NUMERIC(18,3) NOT NULL,

    UNIQUE(production_material_issue_id, line_no)

);

------------------------------------------------------------
-- PRODUCTION RECEIPT
------------------------------------------------------------

CREATE TABLE production_receipt (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    production_order_id UUID NOT NULL
        REFERENCES production_order(id),

    receipt_number VARCHAR(50) NOT NULL,

    receipt_date DATE NOT NULL,

    warehouse_id UUID NOT NULL
        REFERENCES warehouse(id),

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, receipt_number)

);

CREATE TRIGGER trg_production_receipt_updated
BEFORE UPDATE ON production_receipt
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- PRODUCTION RECEIPT ITEM
------------------------------------------------------------

CREATE TABLE production_receipt_item (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    production_receipt_id UUID NOT NULL
        REFERENCES production_receipt(id)
        ON DELETE CASCADE,

    line_no INTEGER NOT NULL,

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    received_quantity NUMERIC(18,3) NOT NULL,

    UNIQUE(production_receipt_id, line_no)

);

------------------------------------------------------------
-- INDEXES
------------------------------------------------------------

CREATE INDEX idx_production_order_style
ON production_order(style_variant_id);

CREATE INDEX idx_production_order_bom
ON production_order(bom_id);

CREATE INDEX idx_production_order_status
ON production_order(status);

CREATE INDEX idx_production_order_item
ON production_order_item(item_id);

CREATE INDEX idx_material_issue_order
ON production_material_issue(production_order_id);

CREATE INDEX idx_material_issue_item
ON production_material_issue_item(item_id);

CREATE INDEX idx_production_receipt_order
ON production_receipt(production_order_id);

CREATE INDEX idx_production_receipt_item
ON production_receipt_item(item_id);

COMMIT;