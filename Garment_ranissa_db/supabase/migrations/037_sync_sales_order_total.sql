BEGIN;

------------------------------------------------------------
-- RECALCULATE SALES ORDER TOTAL
------------------------------------------------------------

CREATE OR REPLACE FUNCTION sync_sales_order_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id UUID;
BEGIN

    --------------------------------------------------------
    -- INSERT / UPDATE
    --------------------------------------------------------

    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        v_order_id := NEW.sales_order_id;

        UPDATE sales_orders
        SET
            total_amount = COALESCE(
                (
                    SELECT SUM(soi.line_total)
                    FROM sales_order_items soi
                    WHERE soi.sales_order_id = v_order_id
                ),
                0
            ),
            updated_at = NOW()
        WHERE id = v_order_id;
    END IF;


    --------------------------------------------------------
    -- DELETE
    --------------------------------------------------------

    IF TG_OP = 'DELETE' THEN
        v_order_id := OLD.sales_order_id;

        UPDATE sales_orders
        SET
            total_amount = COALESCE(
                (
                    SELECT SUM(soi.line_total)
                    FROM sales_order_items soi
                    WHERE soi.sales_order_id = v_order_id
                ),
                0
            ),
            updated_at = NOW()
        WHERE id = v_order_id;

        RETURN OLD;
    END IF;


    --------------------------------------------------------
    -- ITEM MOVED TO ANOTHER SALES ORDER
    --------------------------------------------------------

    IF TG_OP = 'UPDATE'
       AND OLD.sales_order_id IS DISTINCT FROM NEW.sales_order_id
    THEN

        UPDATE sales_orders
        SET
            total_amount = COALESCE(
                (
                    SELECT SUM(soi.line_total)
                    FROM sales_order_items soi
                    WHERE soi.sales_order_id = OLD.sales_order_id
                ),
                0
            ),
            updated_at = NOW()
        WHERE id = OLD.sales_order_id;

    END IF;


    RETURN NEW;

END;
$$;


------------------------------------------------------------
-- TRIGGER
------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_sync_sales_order_total
ON sales_order_items;

CREATE TRIGGER trg_sync_sales_order_total
AFTER INSERT OR UPDATE OR DELETE
ON sales_order_items
FOR EACH ROW
EXECUTE FUNCTION sync_sales_order_total();


------------------------------------------------------------
-- BACKFILL EXISTING SALES ORDERS
------------------------------------------------------------

UPDATE sales_orders so
SET
    total_amount = COALESCE(
        (
            SELECT SUM(soi.line_total)
            FROM sales_order_items soi
            WHERE soi.sales_order_id = so.id
        ),
        0
    ),
    updated_at = NOW();

COMMIT;
