BEGIN;

------------------------------------------------------------
-- VALIDATE COMPANY
------------------------------------------------------------

CREATE OR REPLACE FUNCTION validate_company(

    p_company_id UUID

)

RETURNS BOOLEAN

LANGUAGE plpgsql

AS
$$

BEGIN

    RETURN EXISTS (

        SELECT 1

        FROM company

        WHERE id = p_company_id
          AND is_active = TRUE

    );

END;

$$;

------------------------------------------------------------
-- VALIDATE WAREHOUSE
------------------------------------------------------------

CREATE OR REPLACE FUNCTION validate_warehouse(

    p_company_id UUID,
    p_warehouse_id UUID

)

RETURNS BOOLEAN

LANGUAGE plpgsql

AS
$$

BEGIN

    RETURN EXISTS (

        SELECT 1

        FROM warehouse

        WHERE id = p_warehouse_id
          AND company_id = p_company_id
          AND is_active = TRUE

    );

END;

$$;

------------------------------------------------------------
-- VALIDATE ITEM
------------------------------------------------------------

CREATE OR REPLACE FUNCTION validate_item(

    p_company_id UUID,
    p_item_id UUID

)

RETURNS BOOLEAN

LANGUAGE plpgsql

AS
$$

BEGIN

    RETURN EXISTS (

        SELECT 1

        FROM item_master

        WHERE id = p_item_id
          AND company_id = p_company_id
          AND is_active = TRUE

    );

END;

$$;

------------------------------------------------------------
-- GET CURRENT FISCAL YEAR
------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_current_fiscal_year(

    p_company_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_id UUID;

BEGIN

    SELECT id

    INTO v_id

    FROM fiscal_year

    WHERE company_id = p_company_id
      AND CURRENT_DATE BETWEEN start_date AND end_date
      AND is_closed = FALSE

    LIMIT 1;

    RETURN v_id;

END;

$$;

------------------------------------------------------------
-- GET DEFAULT WAREHOUSE
------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_default_warehouse(

    p_company_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_id UUID;

BEGIN

    SELECT id

    INTO v_id

    FROM warehouse

    WHERE company_id = p_company_id
      AND is_active = TRUE

    ORDER BY created_at

    LIMIT 1;

    RETURN v_id;

END;

$$;

------------------------------------------------------------
-- GET DEFAULT CURRENCY
------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_default_currency(

    p_company_id UUID

)

RETURNS VARCHAR

LANGUAGE plpgsql

AS
$$

DECLARE

    v_currency VARCHAR(10);

BEGIN

    SELECT currency_code

    INTO v_currency

    FROM company

    WHERE id = p_company_id;

    RETURN COALESCE(v_currency,'INR');

END;

$$;

------------------------------------------------------------
-- ROUND CURRENCY
------------------------------------------------------------

CREATE OR REPLACE FUNCTION round_currency(

    p_amount NUMERIC

)

RETURNS NUMERIC

LANGUAGE SQL

AS
$$

SELECT ROUND($1,2);

$$;

------------------------------------------------------------
-- IS DOCUMENT EDITABLE
------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_document_editable(

    p_status VARCHAR

)

RETURNS BOOLEAN

LANGUAGE SQL

AS
$$

SELECT
    UPPER($1) IN ('DRAFT','OPEN','PENDING');
$$;

------------------------------------------------------------
-- GET COMPANY NAME
------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_company_name(

    p_company_id UUID

)

RETURNS TEXT

LANGUAGE SQL

AS
$$

SELECT company_name
FROM company
WHERE id = $1;

$$;

------------------------------------------------------------
-- GET BUSINESS PARTNER NAME
------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_business_partner_name(

    p_partner_id UUID

)

RETURNS TEXT

LANGUAGE SQL

AS
$$

SELECT partner_name
FROM business_partner
WHERE id = $1;

$$;

------------------------------------------------------------
-- GET ITEM NAME
------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_item_name(

    p_item_id UUID

)

RETURNS TEXT

LANGUAGE SQL

AS
$$

SELECT item_name
FROM item_master
WHERE id = $1;

$$;

------------------------------------------------------------
-- GET STYLE NAME
------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_style_name(

    p_style_id UUID

)

RETURNS TEXT

LANGUAGE SQL

AS
$$

SELECT style_name
FROM style_master
WHERE id = $1;

$$;

------------------------------------------------------------
-- IS ACTIVE RECORD
------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_active_record(

    p_table_name TEXT,
    p_record_id UUID

)

RETURNS BOOLEAN

LANGUAGE plpgsql

AS
$$

DECLARE

    v_exists BOOLEAN;

BEGIN

    EXECUTE format(
        'SELECT EXISTS (
             SELECT 1
             FROM %I
             WHERE id = $1
               AND is_active = TRUE
         )',
         p_table_name
    )

    INTO v_exists

    USING p_record_id;

    RETURN COALESCE(v_exists,FALSE);

END;

$$;

COMMIT;