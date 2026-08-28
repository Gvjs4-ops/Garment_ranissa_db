BEGIN;

------------------------------------------------------------
-- ITEM MASTER
------------------------------------------------------------

CREATE TABLE item_master (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    item_code VARCHAR(50) NOT NULL,

    item_name VARCHAR(255) NOT NULL,

    description TEXT,

    item_type_id UUID NOT NULL
        REFERENCES lookup_value(id),

    category_id UUID NOT NULL
        REFERENCES product_category(id),

    group_id UUID
        REFERENCES product_group(id),

    brand_id UUID
        REFERENCES brand(id),

    stock_uom_id UUID NOT NULL
        REFERENCES unit_of_measure(id),

    purchase_uom_id UUID
        REFERENCES unit_of_measure(id),

    sales_uom_id UUID
        REFERENCES unit_of_measure(id),

    purchase_tax_id UUID
        REFERENCES tax_code(id),

    sales_tax_id UUID
        REFERENCES tax_code(id),

    hsn_code VARCHAR(20),

    barcode VARCHAR(100),

    is_purchased BOOLEAN DEFAULT TRUE,

    is_manufactured BOOLEAN DEFAULT FALSE,

    is_saleable BOOLEAN DEFAULT TRUE,

    is_stock_item BOOLEAN DEFAULT TRUE,

    minimum_stock NUMERIC(18,3) DEFAULT 0,

    maximum_stock NUMERIC(18,3) DEFAULT 0,

    reorder_level NUMERIC(18,3) DEFAULT 0,

    reorder_quantity NUMERIC(18,3) DEFAULT 0,

    shelf_life_days INTEGER,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (company_id, item_code)

);

CREATE TRIGGER trg_item_master_updated
BEFORE UPDATE ON item_master
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- ITEM SUPPLIER
------------------------------------------------------------

CREATE TABLE item_supplier (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    item_id UUID NOT NULL
        REFERENCES item_master(id)
        ON DELETE CASCADE,

    supplier_id UUID NOT NULL
        REFERENCES business_partner(id)
        ON DELETE CASCADE,

    supplier_item_code VARCHAR(100),

    lead_time_days INTEGER,

    minimum_order_qty NUMERIC(18,3),

    is_primary BOOLEAN DEFAULT FALSE,

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(item_id, supplier_id)

);

CREATE TRIGGER trg_item_supplier_updated
BEFORE UPDATE ON item_supplier
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- INDEXES
------------------------------------------------------------

CREATE INDEX idx_item_master_code
ON item_master(item_code);

CREATE INDEX idx_item_master_name
ON item_master(item_name);

CREATE INDEX idx_item_master_category
ON item_master(category_id);

CREATE INDEX idx_item_master_group
ON item_master(group_id);

CREATE INDEX idx_item_master_type
ON item_master(item_type_id);

CREATE INDEX idx_item_supplier_item
ON item_supplier(item_id);

CREATE INDEX idx_item_supplier_supplier
ON item_supplier(supplier_id);

COMMIT;