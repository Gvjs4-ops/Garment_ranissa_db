BEGIN;

------------------------------------------------------------
-- BILL OF MATERIAL
------------------------------------------------------------

CREATE TABLE bill_of_material (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    style_version_id UUID NOT NULL
        REFERENCES style_version(id)
        ON DELETE CASCADE,

    bom_code VARCHAR(50) NOT NULL,

    bom_name VARCHAR(255) NOT NULL,

    revision_no INTEGER DEFAULT 1,

    effective_from DATE,

    effective_to DATE,

    is_active BOOLEAN DEFAULT TRUE,

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(style_version_id, revision_no)

);

CREATE TRIGGER trg_bill_of_material_updated
BEFORE UPDATE ON bill_of_material
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- BOM ITEM
------------------------------------------------------------

CREATE TABLE bom_item (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    bom_id UUID NOT NULL
        REFERENCES bill_of_material(id)
        ON DELETE CASCADE,

    line_no INTEGER NOT NULL,

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    uom_id UUID NOT NULL
        REFERENCES unit_of_measure(id),

    quantity NUMERIC(18,4) NOT NULL,

    wastage_percent NUMERIC(8,2) DEFAULT 0,

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(bom_id, line_no)

);

CREATE TRIGGER trg_bom_item_updated
BEFORE UPDATE ON bom_item
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- INDEXES
------------------------------------------------------------

CREATE INDEX idx_bom_style_version
ON bill_of_material(style_version_id);

CREATE INDEX idx_bom_item_bom
ON bom_item(bom_id);

CREATE INDEX idx_bom_item_item
ON bom_item(item_id);

COMMIT;