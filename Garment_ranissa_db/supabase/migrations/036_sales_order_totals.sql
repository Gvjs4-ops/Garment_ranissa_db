CREATE OR REPLACE FUNCTION recalculate_sales_order_total(
    p_sales_order_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS
$$
BEGIN

    UPDATE sales_orders
    SET
        total_amount = COALESCE((
            SELECT SUM(line_total)
            FROM sales_order_items
            WHERE sales_order_id = p_sales_order_id
        ), 0),
        updated_at = NOW()
    WHERE id = p_sales_order_id;

END;
$$;


CREATE OR REPLACE FUNCTION sales_order_item_total_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS
$$
BEGIN

    IF TG_OP = 'DELETE' THEN

        PERFORM recalculate_sales_order_total(
            OLD.sales_order_id
        );

        RETURN OLD;

    ELSE

        PERFORM recalculate_sales_order_total(
            NEW.sales_order_id
        );

        IF TG_OP = 'UPDATE'
           AND OLD.sales_order_id <> NEW.sales_order_id THEN

            PERFORM recalculate_sales_order_total(
                OLD.sales_order_id
            );

        END IF;

        RETURN NEW;

    END IF;

END;
$$;


CREATE TRIGGER trg_sales_order_item_total
AFTER INSERT OR UPDATE OR DELETE
ON sales_order_items
FOR EACH ROW
EXECUTE FUNCTION sales_order_item_total_trigger();
