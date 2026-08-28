/*
===============================================================================
025_sales_invoice.sql

Sales Invoice & Accounts Receivable

Purpose
-------
Creates the schema for customer invoicing and accounts receivable.

Flow

Delivery Note
      ↓
Sales Invoice
      ↓
Accounts Receivable
      ↓
Customer Receipt
      ↓
Journal Posting

===============================================================================
*/

-- ============================================================================
-- Sales Invoice Header
-- ============================================================================

CREATE TABLE sales_invoice (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    invoice_number TEXT NOT NULL,

    customer_id UUID NOT NULL
        REFERENCES business_partner(id),

    sales_order_id UUID
        REFERENCES sales_order(id),

    delivery_note_id UUID,

    invoice_date DATE NOT NULL,

    due_date DATE,

    currency_code TEXT NOT NULL,

    exchange_rate NUMERIC(18,6) DEFAULT 1,

    subtotal NUMERIC(18,2) DEFAULT 0,

    discount_amount NUMERIC(18,2) DEFAULT 0,

    tax_amount NUMERIC(18,2) DEFAULT 0,

    total_amount NUMERIC(18,2) DEFAULT 0,

    paid_amount NUMERIC(18,2) DEFAULT 0,

    balance_amount NUMERIC(18,2) DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'DRAFT',

    remarks TEXT,

    created_by UUID,

    updated_by UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE UNIQUE INDEX ux_sales_invoice_number

ON sales_invoice(

    company_id,

    invoice_number

);

-- ============================================================================
-- Sales Invoice Line
-- ============================================================================

CREATE TABLE sales_invoice_line (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sales_invoice_id UUID NOT NULL
        REFERENCES sales_invoice(id)
        ON DELETE CASCADE,

    sales_order_line_id UUID,

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    style_id UUID,

    color_id UUID,

    size_id UUID,

    quantity NUMERIC(18,4) NOT NULL,

    unit_price NUMERIC(18,2) NOT NULL,

    discount_percent NUMERIC(8,2) DEFAULT 0,

    tax_percent NUMERIC(8,2) DEFAULT 0,

    line_amount NUMERIC(18,2) NOT NULL

);

-- ============================================================================
-- Customer Receivable
-- ============================================================================

CREATE TABLE customer_receivable (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    customer_id UUID NOT NULL
        REFERENCES business_partner(id),

    sales_invoice_id UUID NOT NULL
        REFERENCES sales_invoice(id)
        ON DELETE CASCADE,

    invoice_date DATE NOT NULL,

    due_date DATE,

    invoice_amount NUMERIC(18,2) NOT NULL,

    received_amount NUMERIC(18,2) DEFAULT 0,

    outstanding_amount NUMERIC(18,2) NOT NULL,

    status TEXT DEFAULT 'OPEN',

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

-- ============================================================================
-- Sales Invoice Status History
-- ============================================================================

CREATE TABLE sales_invoice_status_history (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sales_invoice_id UUID NOT NULL
        REFERENCES sales_invoice(id)
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

CREATE INDEX idx_sales_invoice_customer

ON sales_invoice(customer_id);

CREATE INDEX idx_sales_invoice_status

ON sales_invoice(status);

CREATE INDEX idx_sales_invoice_order

ON sales_invoice(sales_order_id);

CREATE INDEX idx_sales_invoice_line_invoice

ON sales_invoice_line(sales_invoice_id);

CREATE INDEX idx_sales_invoice_line_item

ON sales_invoice_line(item_id);

CREATE INDEX idx_customer_receivable_customer

ON customer_receivable(customer_id);

CREATE INDEX idx_customer_receivable_status

ON customer_receivable(status);

CREATE INDEX idx_sales_invoice_history

ON sales_invoice_status_history(sales_invoice_id);
