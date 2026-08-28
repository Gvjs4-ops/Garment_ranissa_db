BEGIN;

------------------------------------------------------------
-- TENANT
------------------------------------------------------------

CREATE TABLE tenant (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_code VARCHAR(30) UNIQUE NOT NULL,

    tenant_name VARCHAR(200) NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE TRIGGER trg_tenant_updated
BEFORE UPDATE ON tenant
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- COMPANY
------------------------------------------------------------

CREATE TABLE company (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_code VARCHAR(30) UNIQUE NOT NULL,

    company_name VARCHAR(250) NOT NULL,

    legal_name VARCHAR(250),

    gst_number VARCHAR(30),

    pan_number VARCHAR(20),

    cin_number VARCHAR(30),

    email VARCHAR(150),

    phone VARCHAR(30),

    website VARCHAR(200),

    logo_url TEXT,

    currency_code VARCHAR(10),

    timezone VARCHAR(60),

    fiscal_year_start DATE,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE TRIGGER trg_company_updated
BEFORE UPDATE ON company
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- ADDRESS
------------------------------------------------------------

CREATE TABLE address (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    address_line1 TEXT,

    address_line2 TEXT,

    landmark TEXT,

    city VARCHAR(100),

    district VARCHAR(100),

    state VARCHAR(100),

    country VARCHAR(100),

    postal_code VARCHAR(20),

    latitude NUMERIC(10,7),

    longitude NUMERIC(10,7),

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE TRIGGER trg_address_updated
BEFORE UPDATE ON address
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- COMPANY ADDRESS
------------------------------------------------------------

CREATE TABLE company_address (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    address_id UUID NOT NULL
        REFERENCES address(id)
        ON DELETE CASCADE,

    address_type VARCHAR(30) DEFAULT 'REGISTERED',

    is_default BOOLEAN DEFAULT TRUE,

    UNIQUE(company_id,address_id,address_type)

);

------------------------------------------------------------
-- BUSINESS UNIT
------------------------------------------------------------

CREATE TABLE business_unit (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    unit_code VARCHAR(30),

    unit_name VARCHAR(200),

    unit_type VARCHAR(50),

    manager_name VARCHAR(150),

    email VARCHAR(150),

    phone VARCHAR(30),

    address_id UUID
        REFERENCES address(id),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(company_id,unit_code)

);

CREATE TRIGGER trg_business_unit_updated
BEFORE UPDATE ON business_unit
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- WAREHOUSE
------------------------------------------------------------

CREATE TABLE warehouse (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    business_unit_id UUID NOT NULL
        REFERENCES business_unit(id)
        ON DELETE CASCADE,

    warehouse_code VARCHAR(30),

    warehouse_name VARCHAR(200),

    warehouse_type VARCHAR(50),

    address_id UUID
        REFERENCES address(id),

    allow_negative_stock BOOLEAN DEFAULT FALSE,

    is_default BOOLEAN DEFAULT FALSE,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(business_unit_id,warehouse_code)

);

CREATE TRIGGER trg_warehouse_updated
BEFORE UPDATE ON warehouse
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- DEPARTMENT
------------------------------------------------------------

CREATE TABLE department (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    business_unit_id UUID NOT NULL
        REFERENCES business_unit(id)
        ON DELETE CASCADE,

    department_code VARCHAR(30),

    department_name VARCHAR(150),

    description TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(business_unit_id,department_code)

);

CREATE TRIGGER trg_department_updated
BEFORE UPDATE ON department
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- COST CENTER
------------------------------------------------------------

CREATE TABLE cost_center (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    cost_center_code VARCHAR(30),

    cost_center_name VARCHAR(150),

    description TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(company_id,cost_center_code)

);

CREATE TRIGGER trg_cost_center_updated
BEFORE UPDATE ON cost_center
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;