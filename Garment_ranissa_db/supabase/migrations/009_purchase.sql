BEGIN;

------------------------------------------------------------
-- PURCHASE ORDER
------------------------------------------------------------

CREATE TABLE purchase_order (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    supplier_id UUID NOT NULL
        REFERENCES business_partner(id),

    po_number VARCHAR(50) NOT NULL,

    po_date DATE NOT NULL,

    expected_delivery_date DATE,

    business_unit_id UUID
        REFERENCES business_unit(id),

    warehouse_id UUID
        REFERENCES warehouse(id),

    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, po_number)

);

CREATE TRIGGER trg_purchase_order_updated
BEFORE UPDATE ON purchase_order
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- PURCHASE ORDER ITEM
------------------------------------------------------------

CREATE TABLE purchase_order_item (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    purchase_order_id UUID NOT NULL
        REFERENCES purchase_order(id)
        ON DELETE CASCADE,

    line_no INTEGER NOT NULL,

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    uom_id UUID NOT NULL
        REFERENCES unit_of_measure(id),

    quantity NUMERIC(18,3) NOT NULL,

    unit_price NUMERIC(18,4) NOT NULL DEFAULT 0,

    discount_percent NUMERIC(8,2) DEFAULT 0,

    tax_id UUID
        REFERENCES tax_code(id),

    remarks TEXT,

    UNIQUE(purchase_order_id, line_no)

);

------------------------------------------------------------
-- GOODS RECEIPT
------------------------------------------------------------

CREATE TABLE goods_receipt (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    supplier_id UUID NOT NULL
        REFERENCES business_partner(id),

    purchase_order_id UUID
        REFERENCES purchase_order(id),

    grn_number VARCHAR(50) NOT NULL,

    grn_date DATE NOT NULL,

    warehouse_id UUID NOT NULL
        REFERENCES warehouse(id),

    status VARCHAR(20) DEFAULT 'DRAFT',

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, grn_number)

);

CREATE TRIGGER trg_goods_receipt_updated
BEFORE UPDATE ON goods_receipt
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- GOODS RECEIPT ITEM
------------------------------------------------------------

CREATE TABLE goods_receipt_item (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    goods_receipt_id UUID NOT NULL
        REFERENCES goods_receipt(id)
        ON DELETE CASCADE,

    purchase_order_item_id UUID
        REFERENCES purchase_order_item(id),

    line_no INTEGER NOT NULL,

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    received_quantity NUMERIC(18,3) NOT NULL,

    accepted_quantity NUMERIC(18,3) NOT NULL,

    rejected_quantity NUMERIC(18,3) DEFAULT 0,

    unit_cost NUMERIC(18,4) DEFAULT 0,

    remarks TEXT,

    UNIQUE(goods_receipt_id, line_no)

);

------------------------------------------------------------
-- INDEXES
------------------------------------------------------------

CREATE INDEX idx_purchase_order_supplier
ON purchase_order(supplier_id);

CREATE INDEX idx_purchase_order_date
ON purchase_order(po_date);

CREATE INDEX idx_purchase_order_status
ON purchase_order(status);

CREATE INDEX idx_purchase_order_item_item
ON purchase_order_item(item_id);

CREATE INDEX idx_goods_receipt_supplier
ON goods_receipt(supplier_id);

CREATE INDEX idx_goods_receipt_date
ON goods_receipt(grn_date);

CREATE INDEX idx_goods_receipt_item_item
ON goods_receipt_item(item_id);

COMMIT;