CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES companies(id),

    customer_id UUID
        REFERENCES customers(id),

    order_number TEXT NOT NULL,

    order_date DATE NOT NULL DEFAULT CURRENT_DATE,

    status TEXT NOT NULL DEFAULT 'DRAFT',

    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,

    created_by UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, order_number)
);


CREATE TABLE sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sales_order_id UUID NOT NULL
        REFERENCES sales_orders(id)
        ON DELETE CASCADE,

    product_id UUID
        REFERENCES products(id),

    quantity NUMERIC(12,2) NOT NULL,

    unit_price NUMERIC(12,2) NOT NULL,

    line_total NUMERIC(14,2)
        GENERATED ALWAYS AS (quantity * unit_price) STORED,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE INDEX idx_sales_orders_company
ON sales_orders(company_id);

CREATE INDEX idx_sales_orders_customer
ON sales_orders(customer_id);

CREATE INDEX idx_sales_orders_status
ON sales_orders(status);

CREATE INDEX idx_sales_order_items_order
ON sales_order_items(sales_order_id);
