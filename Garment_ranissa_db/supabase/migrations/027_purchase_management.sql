/*
===============================================================================
027_purchase_management.sql

Purchase Management

Purpose
-------
Procure-to-Pay Foundation

Flow

Purchase Requisition
        ↓
Request For Quotation (RFQ)
        ↓
Purchase Order
        ↓
Goods Receipt
        ↓
Vendor Invoice
        ↓
Vendor Payment

===============================================================================
*/

-- ============================================================================
-- Purchase Order Header
-- ============================================================================

CREATE TABLE purchase_order (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    order_number TEXT NOT NULL,

    supplier_id UUID NOT NULL
        REFERENCES business_partner(id),

    order_date DATE NOT NULL,

    expected_delivery_date DATE,

    currency_code TEXT NOT NULL,

    exchange_rate NUMERIC(18,6) DEFAULT 1,

    subtotal NUMERIC(18,2) DEFAULT 0,

    discount_amount NUMERIC(18,2) DEFAULT 0,

    tax_amount NUMERIC(18,2) DEFAULT 0,

    total_amount NUMERIC(18,2) DEFAULT 0,

    received_amount NUMERIC(18,4) DEFAULT 0,

    invoiced_amount NUMERIC(18,4) DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'DRAFT',

    remarks TEXT,

    created_by UUID,

    updated_by UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE UNIQUE INDEX ux_purchase_order_number

ON purchase_order(

    company_id,

    order_number

);

-- ============================================================================
-- Purchase Order Line
-- ============================================================================

CREATE TABLE purchase_order_line (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    purchase_order_id UUID NOT NULL
        REFERENCES purchase_order(id)
        ON DELETE CASCADE,

    line_no INTEGER NOT NULL,

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    ordered_quantity NUMERIC(18,4) NOT NULL,

    received_quantity NUMERIC(18,4) DEFAULT 0,

    invoiced_quantity NUMERIC(18,4) DEFAULT 0,

    cancelled_quantity NUMERIC(18,4) DEFAULT 0,

    unit_price NUMERIC(18,2) NOT NULL,

    discount_percent NUMERIC(8,2) DEFAULT 0,

    tax_percent NUMERIC(8,2) DEFAULT 0,

    line_amount NUMERIC(18,2) NOT NULL,

    warehouse_id UUID,

    status TEXT DEFAULT 'OPEN'

);

-- ============================================================================
-- Purchase Order Status History
-- ============================================================================

CREATE TABLE purchase_order_status_history (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    purchase_order_id UUID NOT NULL
        REFERENCES purchase_order(id)
        ON DELETE CASCADE,

    previous_status TEXT,

    current_status TEXT,

    remarks TEXT,

    changed_by UUID,

    changed_at TIMESTAMPTZ DEFAULT NOW()

);

-- ============================================================================
-- Purchase Order Attachments
-- ============================================================================

CREATE TABLE purchase_order_attachment (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    purchase_order_id UUID NOT NULL
        REFERENCES purchase_order(id)
        ON DELETE CASCADE,

    file_name TEXT,

    file_path TEXT,

    mime_type TEXT,

    uploaded_by UUID,

    uploaded_at TIMESTAMPTZ DEFAULT NOW()

);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_purchase_order_supplier

ON purchase_order(supplier_id);

CREATE INDEX idx_purchase_order_status

ON purchase_order(status);

CREATE INDEX idx_purchase_order_date

ON purchase_order(order_date);

CREATE INDEX idx_purchase_order_line_order

ON purchase_order_line(purchase_order_id);

CREATE INDEX idx_purchase_order_line_item

ON purchase_order_line(item_id);

CREATE INDEX idx_purchase_order_history

ON purchase_order_status_history(purchase_order_id);

CREATE INDEX idx_purchase_order_attachment

ON purchase_order_attachment(purchase_order_id);
