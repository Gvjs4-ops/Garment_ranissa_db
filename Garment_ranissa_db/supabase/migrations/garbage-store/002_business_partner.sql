BEGIN;

----------------------------------------------------------
-- Business Partner Type
----------------------------------------------------------

CREATE TABLE business_partner_type (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    type_code VARCHAR(30) UNIQUE NOT NULL,

    type_name VARCHAR(100) NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_bp_type_updated_at
BEFORE UPDATE ON business_partner_type
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

----------------------------------------------------------
-- Business Partner
----------------------------------------------------------

CREATE TABLE business_partner (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES company(id),

    partner_code VARCHAR(30) UNIQUE NOT NULL,

    legal_name VARCHAR(200) NOT NULL,

    display_name VARCHAR(200),

    partner_type_id UUID NOT NULL
        REFERENCES business_partner_type(id),

    gst_number VARCHAR(30),

    pan_number VARCHAR(30),

    email VARCHAR(150),

    phone VARCHAR(40),

    website TEXT,

    credit_limit NUMERIC(18,2),

    payment_terms INTEGER,

    currency_id UUID
        REFERENCES currency(id),

    tax_code_id UUID
        REFERENCES tax_code(id),

    is_active BOOLEAN DEFAULT TRUE,

    remarks TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_bp_updated_at
BEFORE UPDATE ON business_partner
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

----------------------------------------------------------
-- Partner Addresses
----------------------------------------------------------

CREATE TABLE business_partner_address (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    partner_id UUID NOT NULL
        REFERENCES business_partner(id)
        ON DELETE CASCADE,

    address_type VARCHAR(30),

    address_line1 TEXT,

    address_line2 TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    country VARCHAR(100),

    postal_code VARCHAR(20),

    is_default BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_bp_address_updated_at
BEFORE UPDATE ON business_partner_address
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

----------------------------------------------------------
-- Contact Persons
----------------------------------------------------------

CREATE TABLE business_partner_contact (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    partner_id UUID NOT NULL
        REFERENCES business_partner(id)
        ON DELETE CASCADE,

    contact_name VARCHAR(150),

    designation VARCHAR(100),

    email VARCHAR(150),

    mobile VARCHAR(30),

    phone VARCHAR(30),

    is_primary BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE TRIGGER trg_bp_contact_updated_at
BEFORE UPDATE ON business_partner_contact
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;