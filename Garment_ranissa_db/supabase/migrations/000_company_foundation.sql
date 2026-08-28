/*
===============================================================================
000_company_foundation.sql

Purpose
-------
Multi-company / tenant foundation for the ERP.

Design goals:
- One ERP codebase can support multiple businesses.
- Company information is stored in one place.
- Future ERP modules reference company_id.
- Existing tables are not modified by this migration.
===============================================================================
*/

-- ============================================================================
-- Company
-- ============================================================================

CREATE TABLE IF NOT EXISTS companies (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_code TEXT NOT NULL,

    legal_name TEXT NOT NULL,

    display_name TEXT NOT NULL,

    trade_name TEXT,

    business_type TEXT,

    industry TEXT,

    tax_id TEXT,

    registration_number TEXT,

    email TEXT,

    phone TEXT,

    website TEXT,

    address_line_1 TEXT,

    address_line_2 TEXT,

    city TEXT,

    state TEXT,

    country TEXT DEFAULT 'India',

    postal_code TEXT,

    currency_code TEXT DEFAULT 'INR',

    timezone TEXT DEFAULT 'Asia/Kolkata',

    fiscal_year_start_month INTEGER DEFAULT 4,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_companies_company_code
        UNIQUE (company_code),

    CONSTRAINT chk_fiscal_year_start_month
        CHECK (
            fiscal_year_start_month BETWEEN 1 AND 12
        )

);


-- ============================================================================
-- Company Settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_settings (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    setting_key TEXT NOT NULL,

    setting_value TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_company_setting
        UNIQUE (
            company_id,
            setting_key
        )

);


-- ============================================================================
-- Company Users
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_users (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES companies(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    is_active BOOLEAN DEFAULT TRUE,

    is_monitor BOOLEAN DEFAULT FALSE,

    joined_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_company_user
        UNIQUE (
            company_id,
            user_id
        )

);


-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_company_users_company
ON company_users(company_id);

CREATE INDEX IF NOT EXISTS idx_company_users_user
ON company_users(user_id);

CREATE INDEX IF NOT EXISTS idx_company_users_monitor
ON company_users(
    company_id,
    is_monitor
);


-- ============================================================================
-- Initial Company Configuration Function
-- ============================================================================

CREATE OR REPLACE FUNCTION set_company_setting(

    p_company_id UUID,
    p_setting_key TEXT,
    p_setting_value TEXT

)

RETURNS VOID

LANGUAGE plpgsql

AS
$$

BEGIN

    INSERT INTO company_settings (

        company_id,
        setting_key,
        setting_value

    )

    VALUES (

        p_company_id,
        p_setting_key,
        p_setting_value

    )

    ON CONFLICT (
        company_id,
        setting_key
    )

    DO UPDATE SET

        setting_value = EXCLUDED.setting_value,

        updated_at = NOW();

END;

$$;

