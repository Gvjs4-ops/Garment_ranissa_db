/*
===============================================================================
033_maintenance_management.sql

Maintenance Management System

Purpose
-------
Manage factory assets, preventive maintenance, breakdowns,
maintenance work orders and maintenance history.

===============================================================================
*/

-- ============================================================================
-- Maintenance Asset
-- ============================================================================

CREATE TABLE maintenance_asset (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    asset_code TEXT NOT NULL,

    asset_name TEXT NOT NULL,

    asset_category TEXT NOT NULL,

    manufacturer TEXT,

    model_number TEXT,

    serial_number TEXT,

    installation_date DATE,

    purchase_date DATE,

    warranty_expiry DATE,

    warehouse_id UUID
        REFERENCES warehouse(id),

    department_id UUID,

    production_line_id UUID,

    status TEXT DEFAULT 'ACTIVE',

    remarks TEXT,

    created_by UUID,

    updated_by UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE UNIQUE INDEX ux_maintenance_asset

ON maintenance_asset(

    company_id,

    asset_code

);

-- ============================================================================
-- Maintenance Schedule
-- ============================================================================

CREATE TABLE maintenance_schedule (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    asset_id UUID NOT NULL
        REFERENCES maintenance_asset(id)
        ON DELETE CASCADE,

    schedule_code TEXT,

    maintenance_type TEXT NOT NULL,

    frequency TEXT NOT NULL,

    next_due_date DATE NOT NULL,

    estimated_duration INTEGER,

    priority TEXT DEFAULT 'MEDIUM',

    is_active BOOLEAN DEFAULT TRUE,

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

-- ============================================================================
-- Maintenance Breakdown
-- ============================================================================

CREATE TABLE maintenance_breakdown (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    asset_id UUID NOT NULL
        REFERENCES maintenance_asset(id),

    breakdown_number TEXT NOT NULL,

    breakdown_date TIMESTAMPTZ NOT NULL,

    reported_by UUID,

    description TEXT,

    severity TEXT DEFAULT 'MEDIUM',

    status TEXT DEFAULT 'OPEN',

    created_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE UNIQUE INDEX ux_maintenance_breakdown

ON maintenance_breakdown(

    asset_id,

    breakdown_number

);

-- ============================================================================
-- Maintenance Work Order
-- ============================================================================

CREATE TABLE maintenance_work_order (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    work_order_number TEXT NOT NULL,

    asset_id UUID NOT NULL
        REFERENCES maintenance_asset(id),

    breakdown_id UUID
        REFERENCES maintenance_breakdown(id),

    maintenance_type TEXT,

    scheduled_date DATE,

    start_time TIMESTAMPTZ,

    end_time TIMESTAMPTZ,

    assigned_to UUID,

    status TEXT DEFAULT 'OPEN',

    remarks TEXT,

    created_by UUID,

    updated_by UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE UNIQUE INDEX ux_maintenance_work_order

ON maintenance_work_order(

    company_id,

    work_order_number

);

-- ============================================================================
-- Maintenance Work Order Task
-- ============================================================================

CREATE TABLE maintenance_work_order_task (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    maintenance_work_order_id UUID NOT NULL
        REFERENCES maintenance_work_order(id)
        ON DELETE CASCADE,

    sequence_no INTEGER,

    task_description TEXT NOT NULL,

    completed BOOLEAN DEFAULT FALSE,

    completed_by UUID,

    completed_at TIMESTAMPTZ,

    remarks TEXT

);

-- ============================================================================
-- Maintenance Spare Parts
-- ============================================================================

CREATE TABLE maintenance_spare_part (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    maintenance_work_order_id UUID NOT NULL
        REFERENCES maintenance_work_order(id)
        ON DELETE CASCADE,

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    warehouse_id UUID
        REFERENCES warehouse(id),

    quantity NUMERIC(18,4) NOT NULL,

    unit_cost NUMERIC(18,2),

    remarks TEXT

);

-- ============================================================================
-- Maintenance History
-- ============================================================================

CREATE TABLE maintenance_history (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    asset_id UUID NOT NULL
        REFERENCES maintenance_asset(id),

    maintenance_work_order_id UUID
        REFERENCES maintenance_work_order(id),

    maintenance_date DATE,

    maintenance_type TEXT,

    technician_id UUID,

    total_cost NUMERIC(18,2),

    downtime_minutes INTEGER,

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()

);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_asset_status
ON maintenance_asset(status);

CREATE INDEX idx_schedule_due
ON maintenance_schedule(next_due_date);

CREATE INDEX idx_breakdown_status
ON maintenance_breakdown(status);

CREATE INDEX idx_work_order_status
ON maintenance_work_order(status);

CREATE INDEX idx_history_asset
ON maintenance_history(asset_id);
