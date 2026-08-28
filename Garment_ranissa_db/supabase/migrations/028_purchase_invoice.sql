/*
===============================================================================
028_purchase_invoice.sql

Purchase Invoice & Accounts Payable

Purpose
-------
Manage supplier invoices and accounts payable.

Flow

Purchase Order
      ↓
Goods Receipt
      ↓
Purchase Invoice
      ↓
Accounts Payable
      ↓
Vendor Payment

===============================================================================
*/

-- ============================================================================
-- Purchase Invoice Header
-- ============================================================================

CREATE TABLE purchase_invoice (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    invoice_number TEXT NOT NULL,

    supplier_id UUID NOT NULL
        REFERENCES business_partner(id),

    purchase_order_id UUID
        REFERENCES purchase_order(id),

    goods_receipt_id UUID,

    supplier_invoice_number TEXT,

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

CREATE UNIQUE INDEX ux_purchase_invoice_number

ON purchase_invoice(

    company_id,

    invoice_number

);

-- ============================================================================
-- Purchase Invoice Line
-- ============================================================================

CREATE TABLE purchase_invoice_line (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    purchase_invoice_id UUID NOT NULL
        REFERENCES purchase_invoice(id)
        ON DELETE CASCADE,

    purchase_order_line_id UUID
        REFERENCES purchase_order_line(id),

    item_id UUID NOT NULL
        REFERENCES item_master(id),

    quantity NUMERIC(18,4) NOT NULL,

    unit_price NUMERIC(18,2) NOT NULL,

    discount_percent NUMERIC(8,2) DEFAULT 0,

    tax_percent NUMERIC(8,2) DEFAULT 0,

    line_amount NUMERIC(18,2) NOT NULL

);

-- ============================================================================
-- Vendor Payable
-- ============================================================================

CREATE TABLE vendor_payable (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES organization(id),

    supplier_id UUID NOT NULL
        REFERENCES business_partner(id),

    purchase_invoice_id UUID NOT NULL
        REFERENCES purchase_invoice(id)
        ON DELETE CASCADE,

    invoice_date DATE NOT NULL,

    due_date DATE,

    invoice_amount NUMERIC(18,2) NOT NULL,

    paid_amount NUMERIC(18,2) DEFAULT 0,

    outstanding_amount NUMERIC(18,2) NOT NULL,

    status TEXT DEFAULT 'OPEN',

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

-- ============================================================================
-- Purchase Invoice Status History
-- ============================================================================

CREATE TABLE purchase_invoice_status_history (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    purchase_invoice_id UUID NOT NULL
        REFERENCES purchase_invoice(id)
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

CREATE INDEX idx_purchase_invoice_supplier

ON purchase_invoice(supplier_id);

CREATE INDEX idx_purchase_invoice_status

ON purchase_invoice(status);

CREATE INDEX idx_purchase_invoice_po

ON purchase_invoice(purchase_order_id);

CREATE INDEX idx_purchase_invoice_line_invoice

ON purchase_invoice_line(purchase_invoice_id);

CREATE INDEX idx_purchase_invoice_line_item

ON purchase_invoice_line(item_id);

CREATE INDEX idx_vendor_payable_supplier

ON vendor_payable(supplier_id);

CREATE INDEX idx_vendor_payable_status

ON vendor_payable(status);

CREATE INDEX idx_purchase_invoice_history

ON purchase_invoice_status_history(purchase_invoice_id);
