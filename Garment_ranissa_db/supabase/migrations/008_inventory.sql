BEGIN;

------------------------------------------------------------
-- INVENTORY BALANCE
------------------------------------------------------------

CREATE TABLE inventory_balance (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    warehouse_id UUID NOT NULL
        REFERENCES warehouse(id)
        ON DELETE CASCADE,

    item_id UUID NOT NULL
        REFERENCES item_master(id)
        ON DELETE CASCADE,

    quantity_on_hand NUMERIC(18,3) NOT NULL DEFAULT 0,

    quantity_reserved NUMERIC(18,3) NOT NULL DEFAULT 0,

    quantity_available NUMERIC(18,3) NOT NULL DEFAULT 0,

    average_cost NUMERIC(18,4) DEFAULT 0,

    last_updated TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(warehouse_id, item_id)

);

------------------------------------------------------------
-- INVENTORY TRANSACTION
------------------------------------------------------------

CREATE TABLE inventory_transaction (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    warehouse_id UUID NOT NULL
        REFERENCES warehouse(id),

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    transaction_type VARCHAR(30) NOT NULL,

    reference_type VARCHAR(50),

    reference_id UUID,

    quantity_in NUMERIC(18,3) DEFAULT 0,

    quantity_out NUMERIC(18,3) DEFAULT 0,

    unit_cost NUMERIC(18,4) DEFAULT 0,

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()

);

------------------------------------------------------------
-- STOCK ADJUSTMENT
------------------------------------------------------------

CREATE TABLE stock_adjustment (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    warehouse_id UUID NOT NULL
        REFERENCES warehouse(id),

    adjustment_no VARCHAR(50) NOT NULL,

    adjustment_date DATE NOT NULL,

    reason TEXT,

    status VARCHAR(20) DEFAULT 'DRAFT',

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, adjustment_no)

);

CREATE TRIGGER trg_stock_adjustment_updated
BEFORE UPDATE ON stock_adjustment
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- STOCK ADJUSTMENT ITEM
------------------------------------------------------------

CREATE TABLE stock_adjustment_item (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    adjustment_id UUID NOT NULL
        REFERENCES stock_adjustment(id)
        ON DELETE CASCADE,

    line_no INTEGER NOT NULL,

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    current_quantity NUMERIC(18,3),

    adjusted_quantity NUMERIC(18,3),

    remarks TEXT,

    UNIQUE(adjustment_id, line_no)

);

------------------------------------------------------------
-- STOCK TRANSFER
------------------------------------------------------------

CREATE TABLE stock_transfer (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    transfer_no VARCHAR(50) NOT NULL,

    transfer_date DATE NOT NULL,

    from_warehouse_id UUID NOT NULL
        REFERENCES warehouse(id),

    to_warehouse_id UUID NOT NULL
        REFERENCES warehouse(id),

    status VARCHAR(20) DEFAULT 'DRAFT',

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, transfer_no)

);

CREATE TRIGGER trg_stock_transfer_updated
BEFORE UPDATE ON stock_transfer
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- STOCK TRANSFER ITEM
------------------------------------------------------------

CREATE TABLE stock_transfer_item (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    transfer_id UUID NOT NULL
        REFERENCES stock_transfer(id)
        ON DELETE CASCADE,

    line_no INTEGER NOT NULL,

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    quantity NUMERIC(18,3) NOT NULL,

    remarks TEXT,

    UNIQUE(transfer_id, line_no)

);

------------------------------------------------------------
-- INDEXES
------------------------------------------------------------

CREATE INDEX idx_inventory_balance_item
ON inventory_balance(item_id);

CREATE INDEX idx_inventory_balance_warehouse
ON inventory_balance(warehouse_id);

CREATE INDEX idx_inventory_transaction_item
ON inventory_transaction(item_id);

CREATE INDEX idx_inventory_transaction_warehouse
ON inventory_transaction(warehouse_id);

CREATE INDEX idx_inventory_transaction_date
ON inventory_transaction(transaction_date);

COMMIT;