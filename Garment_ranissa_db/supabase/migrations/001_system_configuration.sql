BEGIN;

------------------------------------------------------------
-- Trigger Function (if not already created in bootstrap)
------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

------------------------------------------------------------
-- ERP Modules
------------------------------------------------------------

CREATE TABLE system_module (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    module_code VARCHAR(50) UNIQUE NOT NULL,

    module_name VARCHAR(100) NOT NULL,

    description TEXT,

    display_order INTEGER DEFAULT 0,

    icon VARCHAR(100),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_system_module_updated
BEFORE UPDATE ON system_module
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- ERP Features
------------------------------------------------------------

CREATE TABLE system_feature (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    module_id UUID
        REFERENCES system_module(id)
        ON DELETE CASCADE,

    feature_code VARCHAR(50) UNIQUE NOT NULL,

    feature_name VARCHAR(150) NOT NULL,

    description TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_system_feature_updated
BEFORE UPDATE ON system_feature
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- Company Enabled Features
------------------------------------------------------------

CREATE TABLE company_feature (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID
        REFERENCES company(id),

    feature_id UUID
        REFERENCES system_feature(id),

    is_enabled BOOLEAN DEFAULT TRUE,

    enabled_on TIMESTAMPTZ DEFAULT NOW(),

    enabled_by UUID
        REFERENCES auth.users(id),

    UNIQUE(company_id, feature_id)

);

------------------------------------------------------------
-- Lookup Groups
------------------------------------------------------------

CREATE TABLE lookup_group (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    group_code VARCHAR(50) UNIQUE NOT NULL,

    group_name VARCHAR(100) NOT NULL,

    description TEXT,

    is_system BOOLEAN DEFAULT FALSE,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_lookup_group_updated
BEFORE UPDATE ON lookup_group
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- Lookup Values
------------------------------------------------------------

CREATE TABLE lookup_value (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    group_id UUID NOT NULL
        REFERENCES lookup_group(id)
        ON DELETE CASCADE,

    value_code VARCHAR(50),

    value_name VARCHAR(150),

    display_order INTEGER DEFAULT 0,

    is_default BOOLEAN DEFAULT FALSE,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(group_id, value_code)

);

CREATE TRIGGER trg_lookup_value_updated
BEFORE UPDATE ON lookup_value
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- Company Settings
------------------------------------------------------------

CREATE TABLE company_setting (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID
        REFERENCES company(id),

    setting_key VARCHAR(100),

    setting_value TEXT,

    description TEXT,

    UNIQUE(company_id, setting_key)

);

------------------------------------------------------------
-- Dynamic Attribute Groups
------------------------------------------------------------

CREATE TABLE attribute_group (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    group_code VARCHAR(50) UNIQUE,

    group_name VARCHAR(100),

    description TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_attribute_group_updated
BEFORE UPDATE ON attribute_group
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- Dynamic Attributes
------------------------------------------------------------

CREATE TABLE attribute_definition (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    group_id UUID
        REFERENCES attribute_group(id),

    attribute_code VARCHAR(100),

    attribute_name VARCHAR(150),

    data_type VARCHAR(30),

    is_required BOOLEAN DEFAULT FALSE,

    default_value TEXT,

    display_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(group_id, attribute_code)

);

CREATE TRIGGER trg_attribute_definition_updated
BEFORE UPDATE ON attribute_definition
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;