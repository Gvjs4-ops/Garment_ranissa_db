BEGIN;

------------------------------------------------------------
-- BUSINESS PARTNER
------------------------------------------------------------

CREATE TABLE business_partner (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id),

    company_id UUID NOT NULL
        REFERENCES company(id),

    partner_code VARCHAR(30) NOT NULL,

    partner_name VARCHAR(250) NOT NULL,

    legal_name VARCHAR(250),

    display_name VARCHAR(250),

    is_active BOOLEAN DEFAULT TRUE,

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, partner_code)

);

CREATE TRIGGER trg_business_partner_updated
BEFORE UPDATE ON business_partner
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- BUSINESS PARTNER TYPE
------------------------------------------------------------

CREATE TABLE business_partner_type (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    type_code VARCHAR(30) UNIQUE NOT NULL,

    type_name VARCHAR(100) NOT NULL,

    description TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_business_partner_type_updated
BEFORE UPDATE ON business_partner_type
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- BUSINESS PARTNER TYPE MAP
------------------------------------------------------------

CREATE TABLE business_partner_type_map (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    partner_id UUID NOT NULL
        REFERENCES business_partner(id)
        ON DELETE CASCADE,

    partner_type_id UUID NOT NULL
        REFERENCES business_partner_type(id),

    UNIQUE(partner_id, partner_type_id)

);

------------------------------------------------------------
-- BUSINESS PARTNER ADDRESS
------------------------------------------------------------

CREATE TABLE business_partner_address (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    partner_id UUID NOT NULL
        REFERENCES business_partner(id)
        ON DELETE CASCADE,

    address_id UUID NOT NULL
        REFERENCES address(id),

    address_type VARCHAR(30) DEFAULT 'BILLING',

    is_default BOOLEAN DEFAULT FALSE,

    UNIQUE(partner_id, address_id, address_type)

);

------------------------------------------------------------
-- BUSINESS PARTNER CONTACT
------------------------------------------------------------

CREATE TABLE business_partner_contact (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    partner_id UUID NOT NULL
        REFERENCES business_partner(id)
        ON DELETE CASCADE,

    contact_name VARCHAR(200) NOT NULL,

    designation VARCHAR(100),

    department VARCHAR(100),

    mobile VARCHAR(30),

    phone VARCHAR(30),

    email VARCHAR(150),

    is_primary BOOLEAN DEFAULT FALSE,

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_business_partner_contact_updated
BEFORE UPDATE ON business_partner_contact
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- BUSINESS PARTNER BANK
------------------------------------------------------------

CREATE TABLE business_partner_bank (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    partner_id UUID NOT NULL
        REFERENCES business_partner(id)
        ON DELETE CASCADE,

    bank_name VARCHAR(150),

    branch_name VARCHAR(150),

    account_name VARCHAR(150),

    account_number VARCHAR(100),

    ifsc_code VARCHAR(30),

    swift_code VARCHAR(30),

    is_default BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_business_partner_bank_updated
BEFORE UPDATE ON business_partner_bank
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- BUSINESS PARTNER TAX
------------------------------------------------------------

CREATE TABLE business_partner_tax (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    partner_id UUID NOT NULL
        REFERENCES business_partner(id)
        ON DELETE CASCADE,

    gst_number VARCHAR(30),

    pan_number VARCHAR(20),

    tan_number VARCHAR(20),

    msme_number VARCHAR(50),

    iec_code VARCHAR(50),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_business_partner_tax_updated
BEFORE UPDATE ON business_partner_tax
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;