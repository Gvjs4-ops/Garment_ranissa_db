CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sales_order_id UUID NOT NULL,
    product_id UUID,

    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    line_total NUMERIC(14, 2) NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_sales_order_items_order
        FOREIGN KEY (sales_order_id)
        REFERENCES sales_orders(id)
        ON DELETE CASCADE
);
