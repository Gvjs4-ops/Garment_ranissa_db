/*
===============================================================================
024_sales_management.sql

Sales Management

Purpose
-------
Customer Order Management

Flow

Quotation
    ↓
Sales Order
    ↓
Production Planning
    ↓
Delivery
    ↓
Sales Invoice

===============================================================================
*/

-- ============================================================================
-- Sales Order Header
-- ============================================================================

CREATE TABLE sales_order (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL REFERENCES organization(id),

    order_number TEXT NOT NULL,

    customer_id UUID NOT NULL REFERENCES business_partner(id),

    order_date DATE NOT NULL,

    required_date DATE,

    currency_code TEXT NOT NULL,

    exchange_rate NUMERIC(18,6) DEFAULT 1,

    total_quantity NUMERIC(18,4) DEFAULT 0,

    subtotal NUMERIC(18,2) DEFAULT 0,

    discount_amount NUMERIC(18,2) DEFAULT 0,

    tax_amount NUMERIC(18,2) DEFAULT 0,

    total_amount NUMERIC(18,2) DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'DRAFT',

    remarks TEXT,

    created_by UUID,

    updated_by UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE UNIQUE INDEX ux_sales_order_number

ON sales_order(

    company_id,

    order_number

);

-- ============================================================================
-- Sales Order Line
-- ============================================================================

CREATE TABLE sales_order_line (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sales_order_id UUID NOT NULL
        REFERENCES sales_order(id)
        ON DELETE CASCADE,

    line_no INTEGER NOT NULL,

    item_id UUID NOT NULL REFERENCES item_master(id),

    style_id UUID,

    color_id UUID,

    size_id UUID,

    ordered_quantity NUMERIC(18,4) NOT NULL,

    delivered_quantity NUMERIC(18,4) DEFAULT 0,

    invoiced_quantity NUMERIC(18,4) DEFAULT 0,

    cancelled_quantity NUMERIC(18,4) DEFAULT 0,

    unit_price NUMERIC(18,2) NOT NULL,

    discount_percent NUMERIC(8,2) DEFAULT 0,

    tax_percent NUMERIC(8,2) DEFAULT 0,

    line_amount NUMERIC(18,2) NOT NULL,

    status TEXT DEFAULT 'OPEN'

);

-- ============================================================================
-- Delivery Schedule
-- ============================================================================

CREATE TABLE sales_delivery_schedule (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sales_order_line_id UUID NOT NULL
        REFERENCES sales_order_line(id)
        ON DELETE CASCADE,

    delivery_date DATE NOT NULL,

    scheduled_quantity NUMERIC(18,4) NOT NULL,

    delivered_quantity NUMERIC(18,4) DEFAULT 0,

    status TEXT DEFAULT 'PLANNED'

);

-- ============================================================================
-- Sales Order Status History
-- ============================================================================

CREATE TABLE sales_order_status_history (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sales_order_id UUID NOT NULL
        REFERENCES sales_order(id)
        ON DELETE CASCADE,

    previous_status TEXT,

    current_status TEXT,

    remarks TEXT,

    changed_by UUID,

    changed_at TIMESTAMPTZ DEFAULT NOW()

);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_sales_order_customer

ON sales_order(customer_id);

CREATE INDEX idx_sales_order_status

ON sales_order(status);

CREATE INDEX idx_sales_order_line_order

ON sales_order_line(sales_order_id);

CREATE INDEX idx_sales_order_line_item

ON sales_order_line(item_id);

CREATE INDEX idx_sales_delivery_schedule

ON sales_delivery_schedule(sales_order_line_id);

CREATE INDEX idx_sales_status_history

ON sales_order_status_history(sales_order_id);
