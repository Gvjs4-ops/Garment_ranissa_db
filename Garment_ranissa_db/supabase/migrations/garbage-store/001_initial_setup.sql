-- =====================================================
-- Ranissa ERP
-- Migration: 001_initial_setup.sql
-- Description: Core ERP foundation
-- =====================================================

BEGIN;

---------------------------------------------------------
-- Extensions
---------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

---------------------------------------------------------
-- Trigger Function
---------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

---------------------------------------------------------
-- Company
---------------------------------------------------------

CREATE TABLE company (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_name VARCHAR(150) NOT NULL,

    company_code VARCHAR(20) UNIQUE,

    gst_number VARCHAR(30),

    pan_number VARCHAR(30),

    email VARCHAR(150),

    phone VARCHAR(30),

    website TEXT,

    address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    country VARCHAR(100),

    postal_code VARCHAR(20),

    logo_url TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_company_updated_at
BEFORE UPDATE ON company
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

---------------------------------------------------------
-- Roles
---------------------------------------------------------

CREATE TABLE role (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    role_name VARCHAR(80) UNIQUE NOT NULL,

    description TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_role_updated_at
BEFORE UPDATE ON role
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

---------------------------------------------------------
-- User Profile
-- Links to Supabase auth.users
---------------------------------------------------------

CREATE TABLE user_profile (

    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    company_id UUID REFERENCES company(id),

    role_id UUID REFERENCES role(id),

    full_name VARCHAR(150),

    mobile VARCHAR(30),

    designation VARCHAR(100),

    avatar_url TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_user_profile_updated_at
BEFORE UPDATE ON user_profile
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

---------------------------------------------------------
-- Units
---------------------------------------------------------

CREATE TABLE unit (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    unit_code VARCHAR(20) UNIQUE NOT NULL,

    unit_name VARCHAR(80) NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_unit_updated_at
BEFORE UPDATE ON unit
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

---------------------------------------------------------
-- Currency
---------------------------------------------------------

CREATE TABLE currency (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    currency_code VARCHAR(10) UNIQUE NOT NULL,

    currency_name VARCHAR(80),

    symbol VARCHAR(10),

    exchange_rate NUMERIC(18,6) DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_currency_updated_at
BEFORE UPDATE ON currency
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

---------------------------------------------------------
-- Tax Codes
---------------------------------------------------------

CREATE TABLE tax_code (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tax_name VARCHAR(80),

    tax_percentage NUMERIC(8,2),

    description TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_tax_updated_at
BEFORE UPDATE ON tax_code
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

---------------------------------------------------------
-- Warehouse
---------------------------------------------------------

CREATE TABLE warehouse (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    warehouse_code VARCHAR(20) UNIQUE,

    warehouse_name VARCHAR(120),

    address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    country VARCHAR(100),

    contact_person VARCHAR(100),

    contact_number VARCHAR(30),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_warehouse_updated_at
BEFORE UPDATE ON warehouse
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;