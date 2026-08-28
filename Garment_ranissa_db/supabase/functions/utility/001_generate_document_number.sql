BEGIN;

------------------------------------------------------------
-- DOCUMENT SEQUENCE MASTER
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS document_sequence (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    document_type VARCHAR(30) NOT NULL,

    prefix VARCHAR(20) NOT NULL,

    suffix VARCHAR(20),

    financial_year VARCHAR(20),

    padding_length INTEGER NOT NULL DEFAULT 5,

    current_number BIGINT NOT NULL DEFAULT 0,

    reset_every_financial_year BOOLEAN DEFAULT TRUE,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, document_type, financial_year)

);

CREATE TRIGGER trg_document_sequence_updated
BEFORE UPDATE ON document_sequence
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- GENERATE DOCUMENT NUMBER
------------------------------------------------------------

CREATE OR REPLACE FUNCTION generate_document_number(

    p_company_id UUID,
    p_document_type VARCHAR,
    p_financial_year VARCHAR

)

RETURNS TEXT

LANGUAGE plpgsql

AS
$$

DECLARE

    v_prefix VARCHAR;
    v_suffix VARCHAR;
    v_padding INTEGER;
    v_next_number BIGINT;
    v_document TEXT;

BEGIN

    UPDATE document_sequence
    SET
        current_number = current_number + 1
    WHERE
        company_id = p_company_id
        AND document_type = p_document_type
        AND financial_year = p_financial_year
        AND is_active = TRUE
    RETURNING
        prefix,
        suffix,
        padding_length,
        current_number
    INTO
        v_prefix,
        v_suffix,
        v_padding,
        v_next_number;

    IF NOT FOUND THEN

        RAISE EXCEPTION
        'Document sequence not configured for %',
        p_document_type;

    END IF;

    v_document :=
        COALESCE(v_prefix,'')
        ||
        LPAD(v_next_number::TEXT,v_padding,'0')
        ||
        COALESCE(v_suffix,'');

    RETURN v_document;

END;

$$;

------------------------------------------------------------
-- INITIAL DOCUMENT TYPES
------------------------------------------------------------

INSERT INTO document_sequence (

    tenant_id,
    company_id,
    document_type,
    prefix,
    financial_year

)

SELECT

    t.id,
    c.id,
    x.document_type,
    x.prefix,
    '2026-27'

FROM tenant t
JOIN company c
ON c.tenant_id=t.id

CROSS JOIN (

VALUES

('PURCHASE_ORDER','PO-'),
('GOODS_RECEIPT','GRN-'),
('SALES_ORDER','SO-'),
('DELIVERY_NOTE','DN-'),
('PRODUCTION_ORDER','PROD-'),
('MATERIAL_ISSUE','MI-'),
('PRODUCTION_RECEIPT','PR-'),
('STOCK_TRANSFER','ST-'),
('STOCK_ADJUSTMENT','SA-'),
('JOURNAL_ENTRY','JV-'),
('COST_SHEET','CS-'),
('QUALITY_INSPECTION','QI-')

) AS x(document_type,prefix)

ON CONFLICT DO NOTHING;

COMMIT;