BEGIN;

------------------------------------------------------------
-- STYLE MASTER
------------------------------------------------------------

CREATE TABLE style_master (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    style_code VARCHAR(50) NOT NULL,

    style_name VARCHAR(255) NOT NULL,

    description TEXT,

    category_id UUID NOT NULL
        REFERENCES product_category(id),

    group_id UUID
        REFERENCES product_group(id),

    brand_id UUID
        REFERENCES brand(id),

    season_id UUID
        REFERENCES season(id),

    default_uom_id UUID
        REFERENCES unit_of_measure(id),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, style_code)

);

CREATE TRIGGER trg_style_master_updated
BEFORE UPDATE ON style_master
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- STYLE VERSION
------------------------------------------------------------

CREATE TABLE style_version (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    style_id UUID NOT NULL
        REFERENCES style_master(id)
        ON DELETE CASCADE,

    version_no INTEGER NOT NULL DEFAULT 1,

    version_name VARCHAR(100),

    effective_from DATE,

    remarks TEXT,

    is_current BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(style_id, version_no)

);

CREATE TRIGGER trg_style_version_updated
BEFORE UPDATE ON style_version
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- STYLE COLORWAY
------------------------------------------------------------

CREATE TABLE style_colorway (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    version_id UUID NOT NULL
        REFERENCES style_version(id)
        ON DELETE CASCADE,

    color_id UUID NOT NULL
        REFERENCES color(id),

    colorway_code VARCHAR(50),

    is_default BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(version_id, color_id)

);

CREATE TRIGGER trg_style_colorway_updated
BEFORE UPDATE ON style_colorway
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- STYLE VARIANT
------------------------------------------------------------

CREATE TABLE style_variant (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    colorway_id UUID NOT NULL
        REFERENCES style_colorway(id)
        ON DELETE CASCADE,

    size_id UUID NOT NULL
        REFERENCES size(id),

    finished_good_item_id UUID NOT NULL
        REFERENCES item_master(id),

    sku_code VARCHAR(100),

    barcode VARCHAR(100),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(colorway_id, size_id)

);

CREATE TRIGGER trg_style_variant_updated
BEFORE UPDATE ON style_variant
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- INDEXES
------------------------------------------------------------

CREATE INDEX idx_style_master_code
ON style_master(style_code);

CREATE INDEX idx_style_master_category
ON style_master(category_id);

CREATE INDEX idx_style_version_style
ON style_version(style_id);

CREATE INDEX idx_style_colorway_version
ON style_colorway(version_id);

CREATE INDEX idx_style_variant_colorway
ON style_variant(colorway_id);

CREATE INDEX idx_style_variant_item
ON style_variant(finished_good_item_id);

COMMIT;