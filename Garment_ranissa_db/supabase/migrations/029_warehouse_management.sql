/*
===============================================================================
029_warehouse_management.sql

Warehouse Management

Purpose
-------
Warehouse Operations

Flow

Goods Receipt
      ↓
Put Away
      ↓
Bin Storage
      ↓
Picking
      ↓
Stock Transfer
      ↓
Dispatch

===============================================================================
*/

-- ============================================================================
-- Warehouse Bin
-- ============================================================================

CREATE TABLE warehouse_bin (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    warehouse_id UUID NOT NULL
        REFERENCES warehouse(id),

    bin_code TEXT NOT NULL,

    description TEXT,

    zone TEXT,

    aisle TEXT,

    rack TEXT,

    shelf TEXT,

    capacity NUMERIC(18,4),

    status TEXT DEFAULT 'ACTIVE',

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE UNIQUE INDEX ux_warehouse_bin

ON warehouse_bin(

    warehouse_id,

    bin_code

);

-- ============================================================================
-- Stock Transfer
-- ============================================================================

CREATE TABLE stock_transfer (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    transfer_number TEXT NOT NULL,

    transfer_date DATE NOT NULL,

    from_warehouse_id UUID NOT NULL
        REFERENCES warehouse(id),

    to_warehouse_id UUID NOT NULL
        REFERENCES warehouse(id),

    status TEXT DEFAULT 'DRAFT',

    remarks TEXT,

    created_by UUID,

    updated_by UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE UNIQUE INDEX ux_stock_transfer

ON stock_transfer(

    company_id,

    transfer_number

);

-- ============================================================================
-- Stock Transfer Line
-- ============================================================================

CREATE TABLE stock_transfer_line (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    stock_transfer_id UUID NOT NULL
        REFERENCES stock_transfer(id)
        ON DELETE CASCADE,

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    from_bin_id UUID
        REFERENCES warehouse_bin(id),

    to_bin_id UUID
        REFERENCES warehouse_bin(id),

    quantity NUMERIC(18,4) NOT NULL,

    remarks TEXT

);

-- ============================================================================
-- Stock Adjustment
-- ============================================================================

CREATE TABLE stock_adjustment (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    adjustment_number TEXT NOT NULL,

    adjustment_date DATE NOT NULL,

    warehouse_id UUID
        REFERENCES warehouse(id),

    reason TEXT,

    status TEXT DEFAULT 'DRAFT',

    created_by UUID,

    updated_by UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE UNIQUE INDEX ux_stock_adjustment

ON stock_adjustment(

    company_id,

    adjustment_number

);

-- ============================================================================
-- Stock Adjustment Line
-- ============================================================================

CREATE TABLE stock_adjustment_line (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    stock_adjustment_id UUID NOT NULL
        REFERENCES stock_adjustment(id)
        ON DELETE CASCADE,

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    warehouse_bin_id UUID
        REFERENCES warehouse_bin(id),

    system_quantity NUMERIC(18,4),

    physical_quantity NUMERIC(18,4),

    adjustment_quantity NUMERIC(18,4),

    remarks TEXT

);

-- ============================================================================
-- Cycle Count
-- ============================================================================

CREATE TABLE cycle_count (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    warehouse_id UUID
        REFERENCES warehouse(id),

    count_number TEXT NOT NULL,

    count_date DATE NOT NULL,

    status TEXT DEFAULT 'PLANNED',

    created_by UUID,

    updated_by UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE UNIQUE INDEX ux_cycle_count

ON cycle_count(

    company_id,

    count_number

);

-- ============================================================================
-- Cycle Count Line
-- ============================================================================

CREATE TABLE cycle_count_line (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cycle_count_id UUID NOT NULL
        REFERENCES cycle_count(id)
        ON DELETE CASCADE,

    warehouse_bin_id UUID
        REFERENCES warehouse_bin(id),

    item_id UUID NOT NULL
        REFERENCES item_master(id),

#    lot_number TEXT,

#    batch_number TEXT,

#    serial_number TEXT,

    lot_id UUID REFERENCES inventory_lot(id),
    batch_id UUID REFERENCES inventory_batch(id),
    serial_id UUID REFERENCES inventory_serial(id)

    system_quantity NUMERIC(18,4) NOT NULL DEFAULT 0,

    physical_quantity NUMERIC(18,4),

    variance_quantity NUMERIC(18,4),

    counted_by UUID,

    counted_at TIMESTAMPTZ,

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE INDEX idx_cycle_count_line_cycle

ON cycle_count_line(cycle_count_id);

CREATE INDEX idx_cycle_count_line_item

ON cycle_count_line(item_id);

CREATE INDEX idx_cycle_count_line_bin

ON cycle_count_line(warehouse_bin_id);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_transfer_status

ON stock_transfer(status);

CREATE INDEX idx_transfer_date

ON stock_transfer(transfer_date);

CREATE INDEX idx_adjustment_status

ON stock_adjustment(status);

CREATE INDEX idx_cycle_count_status

ON cycle_count(status);

CREATE INDEX idx_warehouse_bin

ON warehouse_bin(warehouse_id);
