/*
===============================================================================
001_asset.sql

Purpose
-------
Maintenance Asset Management

Responsibilities

- Register Asset
- Update Asset
- Activate Asset
- Deactivate Asset
- Retire Asset
- Validate Asset

===============================================================================
*/

-- ============================================================================
-- Register Asset
-- ============================================================================

CREATE OR REPLACE FUNCTION create_maintenance_asset(

    p_company_id UUID,
    p_asset_code TEXT,
    p_asset_name TEXT,
    p_asset_category TEXT,
    p_manufacturer TEXT,
    p_model_number TEXT,
    p_serial_number TEXT,
    p_installation_date DATE,
    p_purchase_date DATE,
    p_warranty_expiry DATE,
    p_warehouse_id UUID,
    p_department_id UUID,
    p_production_line_id UUID,
    p_criticality TEXT,
    p_expected_life_years INTEGER,
    p_replacement_cost NUMERIC,
    p_maintenance_strategy TEXT,
    p_user_id UUID

)

RETURNS UUID

LANGUAGE plpgsql

AS
$$

DECLARE

    v_asset_id UUID;

BEGIN

    INSERT INTO maintenance_asset(

        company_id,
        asset_code,
        asset_name,
        asset_category,
        manufacturer,
        model_number,
        serial_number,
        installation_date,
        purchase_date,
        warranty_expiry,
        warehouse_id,
        department_id,
        production_line_id,
        criticality,
        expected_life_years,
        replacement_cost,
        maintenance_strategy,
        created_by

    )

    VALUES(

        p_company_id,
        p_asset_code,
        p_asset_name,
        p_asset_category,
        p_manufacturer,
        p_model_number,
        p_serial_number,
        p_installation_date,
        p_purchase_date,
        p_warranty_expiry,
        p_warehouse_id,
        p_department_id,
        p_production_line_id,
        COALESCE(p_criticality,'MEDIUM'),
        p_expected_life_years,
        p_replacement_cost,
        COALESCE(p_maintenance_strategy,'PREVENTIVE'),
        p_user_id

    )

    RETURNING id
    INTO v_asset_id;

    RETURN v_asset_id;

END;

$$;

-- ============================================================================
-- Update Asset Status
-- ============================================================================

CREATE OR REPLACE FUNCTION update_asset_status(

    p_asset_id UUID,
    p_status TEXT,
    p_user_id UUID

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE maintenance_asset

    SET

        status = p_status,

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_asset_id;

END;

$$;

-- ============================================================================
-- Retire Asset
-- ============================================================================

CREATE OR REPLACE FUNCTION retire_asset(

    p_asset_id UUID,
    p_user_id UUID,
    p_remarks TEXT

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    UPDATE maintenance_asset

    SET

        status = 'RETIRED',

        remarks = p_remarks,

        updated_by = p_user_id,

        updated_at = NOW()

    WHERE id = p_asset_id;

END;

$$;

-- ============================================================================
-- Validate Asset
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_asset(

    p_asset_id UUID

)

RETURNS BOOLEAN

LANGUAGE plpgsql

AS
$$

BEGIN

    RETURN EXISTS (

        SELECT 1

        FROM maintenance_asset

        WHERE id = p_asset_id

          AND status = 'ACTIVE'

    );

END;

$$;

-- ============================================================================
-- Calculate Asset Age
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_asset_age(

    p_asset_id UUID

)

RETURNS INTEGER

LANGUAGE plpgsql

AS
$$

DECLARE

    v_purchase_date DATE;

BEGIN

    SELECT purchase_date

    INTO v_purchase_date

    FROM maintenance_asset

    WHERE id = p_asset_id;

    RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_purchase_date));

END;

$$;
