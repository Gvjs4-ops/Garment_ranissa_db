/*
===============================================================================
026_delivery_management.sql

Delivery Management

Purpose
-------
Manage outbound deliveries against Sales Orders.

Flow

Sales Order
      ↓
Delivery Note
      ↓
Inventory Issue
      ↓
Sales Invoice

===============================================================================
*/

-- ============================================================================
-- Delivery Note Header
-- ============================================================================

CREATE TABLE delivery_note (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    delivery_number TEXT NOT NULL,

    sales_order_id UUID
        REFERENCES sales_order(id),

    customer_id UUID NOT NULL
        REFERENCES business_partner(id),

    warehouse_id UUID NOT NULL
        REFERENCES warehouse(id),

    delivery_date DATE NOT NULL,

    vehicle_number TEXT,

    transporter_name TEXT,

    driver_name TEXT,

    tracking_number TEXT,

    status TEXT NOT NULL DEFAULT 'DRAFT',

    remarks TEXT,

    created_by UUID,

    updated_by UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE UNIQUE INDEX ux_delivery_note_number

ON delivery_note(

    company_id,

    delivery_number

);

-- ============================================================================
-- Delivery Note Line
-- ============================================================================

CREATE TABLE delivery_note_line (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    delivery_note_id UUID NOT NULL
        REFERENCES delivery_note(id)
        ON DELETE CASCADE,

    sales_order_line_id UUID
        REFERENCES sales_order_line(id),

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    warehouse_id UUID
        REFERENCES warehouse(id),

    ordered_quantity NUMERIC(18,4) NOT NULL,

    delivered_quantity NUMERIC(18,4) NOT NULL,

    unit_price NUMERIC(18,2),

    remarks TEXT

);

-- ============================================================================
-- Delivery Status History
-- ============================================================================

CREATE TABLE delivery_note_status_history (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    delivery_note_id UUID NOT NULL
        REFERENCES delivery_note(id)
        ON DELETE CASCADE,

    previous_status TEXT,

    current_status TEXT,

    remarks TEXT,

    changed_by UUID,

    changed_at TIMESTAMPTZ DEFAULT NOW()

);

-- ============================================================================
-- Delivery Attachments (Optional)
-- ============================================================================

CREATE TABLE delivery_attachment (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    delivery_note_id UUID NOT NULL
        REFERENCES delivery_note(id)
        ON DELETE CASCADE,

    file_name TEXT NOT NULL,

    file_path TEXT NOT NULL,

    mime_type TEXT,

    uploaded_by UUID,

    uploaded_at TIMESTAMPTZ DEFAULT NOW()

);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_delivery_note_company
ON delivery_note(company_id);

CREATE INDEX idx_delivery_note_customer
ON delivery_note(customer_id);

CREATE INDEX idx_delivery_note_sales_order
ON delivery_note(sales_order_id);

CREATE INDEX idx_delivery_note_status
ON delivery_note(status);

CREATE INDEX idx_delivery_note_date
ON delivery_note(delivery_date);

CREATE INDEX idx_delivery_note_line_delivery
ON delivery_note_line(delivery_note_id);

CREATE INDEX idx_delivery_note_line_item
ON delivery_note_line(item_id);

CREATE INDEX idx_delivery_note_line_order_line
ON delivery_note_line(sales_order_line_id);

CREATE INDEX idx_delivery_status_history
ON delivery_note_status_history(delivery_note_id);

CREATE INDEX idx_delivery_attachment
ON delivery_attachment(delivery_note_id);
