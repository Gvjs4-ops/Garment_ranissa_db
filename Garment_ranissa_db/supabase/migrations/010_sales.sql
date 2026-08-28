BEGIN;

------------------------------------------------------------
-- SALES ORDER
------------------------------------------------------------

CREATE TABLE sales_order (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    customer_id UUID NOT NULL
        REFERENCES business_partner(id),

    so_number VARCHAR(50) NOT NULL,

    so_date DATE NOT NULL,

    expected_delivery_date DATE,

    business_unit_id UUID
        REFERENCES business_unit(id),

    warehouse_id UUID
        REFERENCES warehouse(id),

    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, so_number)

);

CREATE TRIGGER trg_sales_order_updated
BEFORE UPDATE ON sales_order
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- SALES ORDER ITEM
------------------------------------------------------------

CREATE TABLE sales_order_item (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sales_order_id UUID NOT NULL
        REFERENCES sales_order(id)
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

    UNIQUE(sales_order_id, line_no)

);

------------------------------------------------------------
-- DELIVERY NOTE
------------------------------------------------------------

CREATE TABLE delivery_note (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    customer_id UUID NOT NULL
        REFERENCES business_partner(id),

    sales_order_id UUID
        REFERENCES sales_order(id),

    delivery_number VARCHAR(50) NOT NULL,

    delivery_date DATE NOT NULL,

    warehouse_id UUID NOT NULL
        REFERENCES warehouse(id),

    status VARCHAR(20) DEFAULT 'DRAFT',

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, delivery_number)

);

CREATE TRIGGER trg_delivery_note_updated
BEFORE UPDATE ON delivery_note
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- DELIVERY NOTE ITEM
------------------------------------------------------------

CREATE TABLE delivery_note_item (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    delivery_note_id UUID NOT NULL
        REFERENCES delivery_note(id)
        ON DELETE CASCADE,

    sales_order_item_id UUID
        REFERENCES sales_order_item(id),

    line_no INTEGER NOT NULL,

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    delivered_quantity NUMERIC(18,3) NOT NULL,

    unit_price NUMERIC(18,4) DEFAULT 0,

    remarks TEXT,

    UNIQUE(delivery_note_id, line_no)

);

------------------------------------------------------------
-- INDEXES
------------------------------------------------------------

CREATE INDEX idx_sales_order_customer
ON sales_order(customer_id);

CREATE INDEX idx_sales_order_date
ON sales_order(so_date);

CREATE INDEX idx_sales_order_status
ON sales_order(status);

CREATE INDEX idx_sales_order_item_item
ON sales_order_item(item_id);

CREATE INDEX idx_delivery_note_customer
ON delivery_note(customer_id);

CREATE INDEX idx_delivery_note_date
ON delivery_note(delivery_date);

CREATE INDEX idx_delivery_note_item_item
ON delivery_note_item(item_id);

COMMIT;