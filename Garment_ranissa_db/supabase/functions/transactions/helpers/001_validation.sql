/*
===============================================================================
Transaction Validation Helper Functions
===============================================================================
Purpose:
    Common validation routines used by ERP transaction functions.
===============================================================================
*/

-- ============================================================================
-- Validate Company
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_company(
    p_company_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS
$$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM organization
        WHERE id = p_company_id
        AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Invalid or inactive company.';
    END IF;

END;
$$;

-- ============================================================================
-- Validate Warehouse
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_warehouse(
    p_company_id UUID,
    p_warehouse_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS
$$
BEGIN

    IF NOT EXISTS (

        SELECT 1
        FROM warehouse
        WHERE id = p_warehouse_id
        AND company_id = p_company_id
        AND is_active = TRUE

    ) THEN

        RAISE EXCEPTION 'Invalid warehouse.';

    END IF;

END;
$$;

-- ============================================================================
-- Validate Business Partner
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_business_partner(

    p_company_id UUID,

    p_partner_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$
BEGIN

    IF NOT EXISTS (

        SELECT 1
        FROM business_partner
        WHERE id = p_partner_id
        AND company_id = p_company_id
        AND is_active = TRUE

    ) THEN

        RAISE EXCEPTION 'Invalid business partner.';

    END IF;

END;
$$;

-- ============================================================================
-- Validate Item
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_item(

    p_company_id UUID,

    p_item_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$
BEGIN

    IF NOT EXISTS (

        SELECT 1
        FROM item_master
        WHERE id = p_item_id
        AND company_id = p_company_id
        AND is_active = TRUE

    ) THEN

        RAISE EXCEPTION 'Invalid item.';

    END IF;

END;
$$;

-- ============================================================================
-- Validate Document Status
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_document_status(

    p_status TEXT,

    p_expected TEXT

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$
BEGIN

    IF p_status <> p_expected THEN

        RAISE EXCEPTION
            'Document must be in % status. Current status is %.',
            p_expected,
            p_status;

    END IF;

END;
$$;
