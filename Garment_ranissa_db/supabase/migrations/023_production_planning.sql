/*
===============================================================================
023_production_planning.sql

Production Planning (PPC)

Purpose
-------
Planning layer between Sales Orders and Production Orders.

Flow

Sales Order
      ↓
Production Plan
      ↓
Material Planning
      ↓
Production Order

===============================================================================
*/

-- ============================================================================
-- Production Plan Header
-- ============================================================================

CREATE TABLE production_plan (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL REFERENCES organization(id),

    plan_number TEXT NOT NULL,

    plan_date DATE NOT NULL,

    start_date DATE,

    end_date DATE,

    priority TEXT NOT NULL DEFAULT 'NORMAL',

    status TEXT NOT NULL DEFAULT 'DRAFT',

    planner_id UUID,

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    created_by UUID,

    updated_by UUID

);

CREATE UNIQUE INDEX ux_production_plan_number

ON production_plan(company_id, plan_number);

-- ============================================================================
-- Production Plan Lines
-- ============================================================================

CREATE TABLE production_plan_line (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    production_plan_id UUID NOT NULL
        REFERENCES production_plan(id) ON DELETE CASCADE,

    sales_order_id UUID,

    sales_order_line_id UUID,

    style_id UUID,

    color_id UUID,

    size_id UUID,

    planned_quantity NUMERIC(18,4) NOT NULL,

    planned_start_date DATE,

    planned_end_date DATE,

    production_line_id UUID,

    supervisor_id UUID,

    status TEXT DEFAULT 'PLANNED',

    remarks TEXT

);

-- ============================================================================
-- Planned Operations
-- ============================================================================

CREATE TABLE production_plan_operation (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    production_plan_line_id UUID NOT NULL
        REFERENCES production_plan_line(id)
        ON DELETE CASCADE,

    operation_id UUID,

    sequence_no INTEGER,

    estimated_minutes NUMERIC(18,2),

    planned_start TIMESTAMPTZ,

    planned_end TIMESTAMPTZ,

    status TEXT DEFAULT 'PLANNED'

);

-- ============================================================================
-- Capacity Allocation
-- ============================================================================

CREATE TABLE production_plan_capacity (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    production_plan_line_id UUID NOT NULL
        REFERENCES production_plan_line(id)
        ON DELETE CASCADE,

    production_line_id UUID,

    machine_id UUID,

    operator_id UUID,

    available_minutes NUMERIC(18,2),

    allocated_minutes NUMERIC(18,2),

    utilization_percent NUMERIC(8,2)

);

-- ============================================================================
-- Schedule
-- ============================================================================

CREATE TABLE production_plan_schedule (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    production_plan_line_id UUID NOT NULL
        REFERENCES production_plan_line(id)
        ON DELETE CASCADE,

    work_date DATE,

    shift TEXT,

    planned_quantity NUMERIC(18,4),

    planned_minutes NUMERIC(18,2),

    production_line_id UUID

);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_plan_company
ON production_plan(company_id);

CREATE INDEX idx_plan_status
ON production_plan(status);

CREATE INDEX idx_plan_line
ON production_plan_line(production_plan_id);

CREATE INDEX idx_plan_operation
ON production_plan_operation(production_plan_line_id);

CREATE INDEX idx_plan_capacity
ON production_plan_capacity(production_plan_line_id);

CREATE INDEX idx_plan_schedule
ON production_plan_schedule(production_plan_line_id);
