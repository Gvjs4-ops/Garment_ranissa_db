BEGIN;

------------------------------------------------------------
-- ACCOUNT TYPE
------------------------------------------------------------

CREATE TABLE account_type (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    type_code VARCHAR(30) NOT NULL,

    type_name VARCHAR(100) NOT NULL,

    normal_balance VARCHAR(10) NOT NULL,

    display_order INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, type_code)

);

CREATE TRIGGER trg_account_type_updated
BEFORE UPDATE ON account_type
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- CHART OF ACCOUNTS
------------------------------------------------------------

CREATE TABLE chart_of_account (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    account_type_id UUID NOT NULL
        REFERENCES account_type(id),

    parent_account_id UUID
        REFERENCES chart_of_account(id),

    account_code VARCHAR(30) NOT NULL,

    account_name VARCHAR(200) NOT NULL,

    account_level INTEGER DEFAULT 1,

    is_control_account BOOLEAN DEFAULT FALSE,

    allow_manual_entry BOOLEAN DEFAULT TRUE,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, account_code)

);

CREATE TRIGGER trg_chart_of_account_updated
BEFORE UPDATE ON chart_of_account
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- FISCAL YEAR
------------------------------------------------------------

CREATE TABLE fiscal_year (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    fiscal_year_code VARCHAR(20) NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    is_closed BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, fiscal_year_code)

);

------------------------------------------------------------
-- COST CENTER
------------------------------------------------------------

CREATE TABLE cost_center (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    center_code VARCHAR(30) NOT NULL,

    center_name VARCHAR(150) NOT NULL,

    description TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, center_code)

);

CREATE TRIGGER trg_cost_center_updated
BEFORE UPDATE ON cost_center
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- JOURNAL ENTRY
------------------------------------------------------------

CREATE TABLE journal_entry (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenant(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company(id)
        ON DELETE CASCADE,

    fiscal_year_id UUID NOT NULL
        REFERENCES fiscal_year(id),

    journal_number VARCHAR(50) NOT NULL,

    journal_date DATE NOT NULL,

    reference_type VARCHAR(50),

    reference_id UUID,

    remarks TEXT,

    status VARCHAR(20) DEFAULT 'DRAFT',

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, journal_number)

);

CREATE TRIGGER trg_journal_entry_updated
BEFORE UPDATE ON journal_entry
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

------------------------------------------------------------
-- JOURNAL ENTRY LINE
------------------------------------------------------------

CREATE TABLE journal_entry_line (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    journal_entry_id UUID NOT NULL
        REFERENCES journal_entry(id)
        ON DELETE CASCADE,

    line_no INTEGER NOT NULL,

    account_id UUID NOT NULL
        REFERENCES chart_of_account(id),

    cost_center_id UUID
        REFERENCES cost_center(id),

    debit NUMERIC(18,2) DEFAULT 0,

    credit NUMERIC(18,2) DEFAULT 0,

    narration TEXT,

    UNIQUE(journal_entry_id, line_no)

);

------------------------------------------------------------
-- INDEXES
------------------------------------------------------------

CREATE INDEX idx_coa_code
ON chart_of_account(account_code);

CREATE INDEX idx_journal_date
ON journal_entry(journal_date);

CREATE INDEX idx_journal_status
ON journal_entry(status);

CREATE INDEX idx_journal_reference
ON journal_entry(reference_type, reference_id);

CREATE INDEX idx_journal_line_account
ON journal_entry_line(account_id);

COMMIT;