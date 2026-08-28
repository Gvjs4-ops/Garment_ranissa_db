/*
===============================================================================
030_warehouse_execution.sql

Warehouse Execution System (WES)

Purpose
-------
Operational warehouse execution after inventory transactions.

===============================================================================
*/

-- ============================================================================
-- Put-away Task
-- ============================================================================

CREATE TABLE warehouse_putaway (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    receipt_id UUID,

    warehouse_id UUID NOT NULL
        REFERENCES warehouse(id),

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    quantity NUMERIC(18,4) NOT NULL,

    source_bin_id UUID
        REFERENCES warehouse_bin(id),

    destination_bin_id UUID
        REFERENCES warehouse_bin(id),

    priority INTEGER DEFAULT 5,

    status TEXT DEFAULT 'OPEN',

    assigned_to UUID,

    created_by UUID,

    completed_by UUID,

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    completed_at TIMESTAMPTZ

);

-- ============================================================================
-- Picking Task
-- ============================================================================

CREATE TABLE warehouse_pick_task (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    pick_number TEXT NOT NULL,

    warehouse_id UUID NOT NULL
        REFERENCES warehouse(id),

    sales_order_id UUID,

    delivery_note_id UUID,

    priority INTEGER DEFAULT 5,

    status TEXT DEFAULT 'OPEN',

    assigned_to UUID,

    created_by UUID,

    completed_by UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    completed_at TIMESTAMPTZ

);

-- ============================================================================
-- Picking Task Line
-- ============================================================================

CREATE TABLE warehouse_pick_task_line (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    warehouse_pick_task_id UUID
        REFERENCES warehouse_pick_task(id)
        ON DELETE CASCADE,

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    warehouse_bin_id UUID
        REFERENCES warehouse_bin(id),

    required_quantity NUMERIC(18,4),

    picked_quantity NUMERIC(18,4) DEFAULT 0,

    status TEXT DEFAULT 'OPEN'

);

-- ============================================================================
-- Wave
-- ============================================================================

CREATE TABLE warehouse_wave (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    wave_number TEXT NOT NULL,

    warehouse_id UUID
        REFERENCES warehouse(id),

    wave_date DATE,

    status TEXT DEFAULT 'OPEN',

    created_at TIMESTAMPTZ DEFAULT NOW()

);

-- ============================================================================
-- Dispatch
-- ============================================================================

CREATE TABLE warehouse_dispatch (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    dispatch_number TEXT NOT NULL,

    warehouse_id UUID
        REFERENCES warehouse(id),

    delivery_note_id UUID,

    dispatch_date DATE,

    vehicle_number TEXT,

    transporter_name TEXT,

    status TEXT DEFAULT 'OPEN',

    created_at TIMESTAMPTZ DEFAULT NOW()

);

-- ============================================================================
-- Dispatch Line
-- ============================================================================

CREATE TABLE warehouse_dispatch_line (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    warehouse_dispatch_id UUID
        REFERENCES warehouse_dispatch(id)
        ON DELETE CASCADE,

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    quantity NUMERIC(18,4),

    warehouse_bin_id UUID
        REFERENCES warehouse_bin(id)

);

-- ============================================================================
-- Inventory Reservation
-- ============================================================================

CREATE TABLE inventory_reservation (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    sales_order_id UUID
        REFERENCES sales_order(id),

    production_plan_id UUID,

    warehouse_id UUID NOT NULL
        REFERENCES warehouse(id),

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    reserved_quantity NUMERIC(18,4) NOT NULL,

    consumed_quantity NUMERIC(18,4) DEFAULT 0,

    status TEXT DEFAULT 'RESERVED',

    created_by UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE INDEX idx_inventory_reservation_item
ON inventory_reservation(item_id);

CREATE INDEX idx_inventory_reservation_status
ON inventory_reservation(status);

CREATE INDEX idx_inventory_reservation_order
ON inventory_reservation(sales_order_id);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_putaway_status
ON warehouse_putaway(status);

CREATE INDEX idx_pick_status
ON warehouse_pick_task(status);

CREATE INDEX idx_pick_line_task
ON warehouse_pick_task_line(warehouse_pick_task_id);

CREATE INDEX idx_wave_status
ON warehouse_wave(status);

CREATE INDEX idx_dispatch_status
ON warehouse_dispatch(status);

CREATE INDEX idx_dispatch_line_dispatch
ON warehouse_dispatch_line(warehouse_dispatch_id);
