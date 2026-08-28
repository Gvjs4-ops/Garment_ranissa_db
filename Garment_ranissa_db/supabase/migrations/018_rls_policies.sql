BEGIN;

------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY
------------------------------------------------------------

ALTER TABLE tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE company ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_unit ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse ENABLE ROW LEVEL SECURITY;

ALTER TABLE business_partner ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_partner_contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_partner_address ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_partner_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_partner_tax ENABLE ROW LEVEL SECURITY;

ALTER TABLE product_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand ENABLE ROW LEVEL SECURITY;
ALTER TABLE season ENABLE ROW LEVEL SECURITY;
ALTER TABLE color ENABLE ROW LEVEL SECURITY;
ALTER TABLE size ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_of_measure ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_code ENABLE ROW LEVEL SECURITY;

ALTER TABLE item_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_supplier ENABLE ROW LEVEL SECURITY;

ALTER TABLE style_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_colorway ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_variant ENABLE ROW LEVEL SECURITY;

ALTER TABLE bill_of_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_item ENABLE ROW LEVEL SECURITY;

ALTER TABLE inventory_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustment ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustment_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_item ENABLE ROW LEVEL SECURITY;

ALTER TABLE purchase_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_item ENABLE ROW LEVEL SECURITY;

ALTER TABLE sales_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_note ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_note_item ENABLE ROW LEVEL SECURITY;

ALTER TABLE production_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_order_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_material_issue ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_material_issue_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_receipt ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_receipt_item ENABLE ROW LEVEL SECURITY;

ALTER TABLE cost_component ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_sheet ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_sheet_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_rate ENABLE ROW LEVEL SECURITY;
ALTER TABLE overhead_rate ENABLE ROW LEVEL SECURITY;

ALTER TABLE defect_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE defect_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_inspection ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_inspection_item ENABLE ROW LEVEL SECURITY;

ALTER TABLE account_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_year ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_center ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_line ENABLE ROW LEVEL SECURITY;

ALTER TABLE approval_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflow_step ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_approval ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

------------------------------------------------------------
-- HELPER FUNCTION
------------------------------------------------------------

CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
SELECT NULLIF(auth.jwt()->>'tenant_id','')::uuid;
$$;

CREATE OR REPLACE FUNCTION current_company_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
SELECT NULLIF(auth.jwt()->>'company_id','')::uuid;
$$;

------------------------------------------------------------
-- TENANT POLICY
------------------------------------------------------------

CREATE POLICY tenant_policy
ON tenant
FOR ALL
TO authenticated
USING (
    id = current_tenant_id()
)
WITH CHECK (
    id = current_tenant_id()
);

------------------------------------------------------------
-- COMPANY POLICY
------------------------------------------------------------

CREATE POLICY company_policy
ON company
FOR ALL
TO authenticated
USING (
    tenant_id = current_tenant_id()
)
WITH CHECK (
    tenant_id = current_tenant_id()
);

------------------------------------------------------------
-- BUSINESS UNIT POLICY
------------------------------------------------------------

CREATE POLICY business_unit_policy
ON business_unit
FOR ALL
TO authenticated
USING (
    company_id = current_company_id()
)
WITH CHECK (
    company_id = current_company_id()
);

------------------------------------------------------------
-- WAREHOUSE POLICY
------------------------------------------------------------

CREATE POLICY warehouse_policy
ON warehouse
FOR ALL
TO authenticated
USING (
    company_id = current_company_id()
)
WITH CHECK (
    company_id = current_company_id()
);

------------------------------------------------------------
-- GENERIC COMPANY POLICY
------------------------------------------------------------

DO $$
DECLARE
    t TEXT;
BEGIN

FOR t IN
SELECT unnest(ARRAY[

'business_partner',
'product_category',
'product_group',
'brand',
'season',
'color',
'size',
'unit_of_measure',
'tax_code',

'item_master',

'style_master',

'bill_of_material',

'inventory_balance',
'inventory_transaction',
'stock_adjustment',
'stock_transfer',

'purchase_order',
'goods_receipt',

'sales_order',
'delivery_note',

'production_order',
'production_material_issue',
'production_receipt',

'cost_sheet',

'inspection_plan',
'quality_inspection',

'chart_of_account',
'fiscal_year',
'cost_center',
'journal_entry',

'approval_workflow',
'document_approval',

'audit_log'

])

LOOP

EXECUTE format('

CREATE POLICY %I_company_policy

ON %I

FOR ALL

TO authenticated

USING (company_id=current_company_id())

WITH CHECK (company_id=current_company_id());

',t,t);

END LOOP;

END;
$$;

------------------------------------------------------------
-- READ ONLY MASTER DATA
------------------------------------------------------------

CREATE POLICY lookup_read_only
ON lookup_value
FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY lookup_type_read_only
ON lookup_type
FOR SELECT
TO authenticated
USING (TRUE);

------------------------------------------------------------
-- AUTH USERS
------------------------------------------------------------

REVOKE ALL
ON ALL TABLES
IN SCHEMA public
FROM anon;

GRANT SELECT,INSERT,UPDATE,DELETE
ON ALL TABLES
IN SCHEMA public
TO authenticated;

COMMIT;