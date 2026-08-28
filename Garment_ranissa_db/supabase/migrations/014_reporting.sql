BEGIN;

------------------------------------------------------------
-- INVENTORY SUMMARY
------------------------------------------------------------

CREATE VIEW vw_inventory_summary AS
SELECT
    ib.tenant_id,
    ib.company_id,
    ib.warehouse_id,
    w.warehouse_name,
    ib.item_id,
    i.item_code,
    i.item_name,
    ib.quantity_on_hand,
    ib.quantity_reserved,
    ib.quantity_available,
    ib.average_cost,
    (ib.quantity_on_hand * ib.average_cost) AS inventory_value
FROM inventory_balance ib
JOIN warehouse w ON w.id = ib.warehouse_id
JOIN item_master i ON i.id = ib.item_id;

------------------------------------------------------------
-- PURCHASE SUMMARY
------------------------------------------------------------

CREATE VIEW vw_purchase_summary AS
SELECT
    po.id,
    po.company_id,
    po.po_number,
    po.po_date,
    bp.partner_name AS supplier_name,
    po.status,
    COUNT(poi.id) AS total_items,
    COALESCE(SUM(poi.quantity * poi.unit_price),0) AS total_amount
FROM purchase_order po
JOIN business_partner bp
    ON bp.id = po.supplier_id
LEFT JOIN purchase_order_item poi
    ON poi.purchase_order_id = po.id
GROUP BY
    po.id,
    po.company_id,
    po.po_number,
    po.po_date,
    bp.partner_name,
    po.status;

------------------------------------------------------------
-- SALES SUMMARY
------------------------------------------------------------

CREATE VIEW vw_sales_summary AS
SELECT
    so.id,
    so.company_id,
    so.so_number,
    so.so_date,
    bp.partner_name AS customer_name,
    so.status,
    COUNT(soi.id) AS total_items,
    COALESCE(SUM(soi.quantity * soi.unit_price),0) AS total_amount
FROM sales_order so
JOIN business_partner bp
    ON bp.id = so.customer_id
LEFT JOIN sales_order_item soi
    ON soi.sales_order_id = so.id
GROUP BY
    so.id,
    so.company_id,
    so.so_number,
    so.so_date,
    bp.partner_name,
    so.status;

------------------------------------------------------------
-- PRODUCTION SUMMARY
------------------------------------------------------------

CREATE VIEW vw_production_summary AS
SELECT
    po.id,
    po.company_id,
    po.production_number,
    sm.style_code,
    sm.style_name,
    po.planned_quantity,
    po.completed_quantity,
    po.status
FROM production_order po
JOIN style_variant sv
    ON sv.id = po.style_variant_id
JOIN style_colorway sc
    ON sc.id = sv.colorway_id
JOIN style_version ver
    ON ver.id = sc.version_id
JOIN style_master sm
    ON sm.id = ver.style_id;

------------------------------------------------------------
-- COST SHEET SUMMARY
------------------------------------------------------------

CREATE VIEW vw_cost_sheet_summary AS
SELECT
    cs.id,
    cs.company_id,
    cs.cost_sheet_no,
    sm.style_code,
    sm.style_name,
    cs.total_material_cost,
    cs.total_labor_cost,
    cs.total_overhead_cost,
    cs.total_other_cost,
    cs.total_cost,
    cs.status
FROM cost_sheet cs
JOIN style_version sv
    ON sv.id = cs.style_version_id
JOIN style_master sm
    ON sm.id = sv.style_id;

COMMIT;