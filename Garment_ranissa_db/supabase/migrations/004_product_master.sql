BEGIN;

------------------------------------------------------------
-- PRODUCT CATEGORY
------------------------------------------------------------

CREATE TABLE product_category (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    category_code VARCHAR(30) NOT NULL,

    category_name VARCHAR(100) NOT NULL,

    description TEXT,

    display_order INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (tenant_id, category_code)

);

CREATE TRIGGER trg_product_category_updated
BEFORE UPDATE ON product_category
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- PRODUCT GROUP
------------------------------------------------------------

CREATE TABLE product_group (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    category_id UUID NOT NULL
        REFERENCES product_category(id)
        ON DELETE RESTRICT,

    group_code VARCHAR(30) NOT NULL,

    group_name VARCHAR(100) NOT NULL,

    description TEXT,

    display_order INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (tenant_id, group_code)

);

CREATE TRIGGER trg_product_group_updated
BEFORE UPDATE ON product_group
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- BRAND
------------------------------------------------------------

CREATE TABLE brand (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    brand_code VARCHAR(30) NOT NULL,

    brand_name VARCHAR(100) NOT NULL,

    description TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (tenant_id, brand_code)

);

CREATE TRIGGER trg_brand_updated
BEFORE UPDATE ON brand
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- SEASON
------------------------------------------------------------

CREATE TABLE season (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    season_code VARCHAR(20) NOT NULL,

    season_name VARCHAR(100) NOT NULL,

    start_month SMALLINT,

    end_month SMALLINT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (tenant_id, season_code)

);

CREATE TRIGGER trg_season_updated
BEFORE UPDATE ON season
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- COLOR
------------------------------------------------------------

CREATE TABLE color (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    color_code VARCHAR(30) NOT NULL,

    color_name VARCHAR(100) NOT NULL,

    hex_code VARCHAR(10),

    pantone_code VARCHAR(50),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (tenant_id, color_code)

);

CREATE TRIGGER trg_color_updated
BEFORE UPDATE ON color
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- SIZE
------------------------------------------------------------

CREATE TABLE size (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    size_code VARCHAR(30) NOT NULL,

    size_name VARCHAR(100) NOT NULL,

    display_order INTEGER DEFAULT 0,

    is_numeric BOOLEAN DEFAULT FALSE,

    numeric_value NUMERIC(10,2),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (tenant_id, size_code)

);

CREATE TRIGGER trg_size_updated
BEFORE UPDATE ON size
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- UNIT OF MEASURE
------------------------------------------------------------

CREATE TABLE unit_of_measure (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    uom_code VARCHAR(20) NOT NULL,

    uom_name VARCHAR(100) NOT NULL,

    symbol VARCHAR(20),

    decimal_precision SMALLINT DEFAULT 2,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (tenant_id, uom_code)

);

CREATE TRIGGER trg_uom_updated
BEFORE UPDATE ON unit_of_measure
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- TAX CODE
------------------------------------------------------------

CREATE TABLE tax_code (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    tax_code VARCHAR(30) NOT NULL,

    tax_name VARCHAR(100) NOT NULL,

    tax_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,

    description TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (tenant_id, tax_code)

);

CREATE TRIGGER trg_tax_code_updated
BEFORE UPDATE ON tax_code
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;