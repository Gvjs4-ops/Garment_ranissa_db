BEGIN;

------------------------------------------------------------
-- DASHBOARD : INVENTORY
------------------------------------------------------------

CREATE VIEW dashboard_inventory AS
SELECT
    company_id,
    COUNT(DISTINCT item_id)                    AS total_items,
    COUNT(DISTINCT warehouse_id)               AS total_warehouses,
    SUM(quantity_on_hand)                      AS quantity_on_hand,
    SUM(quantity_reserved)                     AS quantity_reserved,
    SUM(quantity_available)                    AS quantity_available,
    SUM(quantity_on_hand * average_cost)       AS inventory_value
FROM inventory_balance
GROUP BY company_id;

------------------------------------------------------------
-- DASHBOARD : PURCHASE
------------------------------------------------------------

CREATE VIEW dashboard_purchase AS
SELECT
    company_id,
    COUNT(*) FILTER (WHERE status='DRAFT')     AS draft_po,
    COUNT(*) FILTER (WHERE status='APPROVED')  AS approved_po,
    COUNT(*) FILTER (WHERE status='CLOSED')    AS closed_po,
    COUNT(*)                                   AS total_purchase_orders
FROM purchase_order
GROUP BY company_id;

------------------------------------------------------------
-- DASHBOARD : SALES
------------------------------------------------------------

CREATE VIEW dashboard_sales AS
SELECT
    company_id,
    COUNT(*) FILTER (WHERE status='DRAFT')     AS draft_so,
    COUNT(*) FILTER (WHERE status='APPROVED')  AS approved_so,
    COUNT(*) FILTER (WHERE status='CLOSED')    AS closed_so,
    COUNT(*)                                   AS total_sales_orders
FROM sales_order
GROUP BY company_id;

------------------------------------------------------------
-- DASHBOARD : PRODUCTION
------------------------------------------------------------

CREATE VIEW dashboard_production AS
SELECT
    company_id,
    COUNT(*) FILTER (WHERE status='PLANNED')       AS planned_orders,
    COUNT(*) FILTER (WHERE status='IN_PROGRESS')   AS in_progress_orders,
    COUNT(*) FILTER (WHERE status='COMPLETED')     AS completed_orders,
    SUM(planned_quantity)                          AS planned_quantity,
    SUM(completed_quantity)                        AS completed_quantity
FROM production_order
GROUP BY company_id;

------------------------------------------------------------
-- DASHBOARD : COSTING
------------------------------------------------------------

CREATE VIEW dashboard_costing AS
SELECT
    company_id,
    COUNT(*)                           AS total_cost_sheets,
    AVG(total_cost)                    AS average_cost,
    MIN(total_cost)                    AS minimum_cost,
    MAX(total_cost)                    AS maximum_cost,
    SUM(total_cost)                    AS total_cost
FROM cost_sheet
GROUP BY company_id;

------------------------------------------------------------
-- DASHBOARD : QUALITY
------------------------------------------------------------

CREATE VIEW dashboard_quality AS
SELECT
    company_id,
    COUNT(*) FILTER (WHERE status='PENDING')   AS pending_inspections,
    COUNT(*) FILTER (WHERE status='PASSED')    AS passed_inspections,
    COUNT(*) FILTER (WHERE status='FAILED')    AS failed_inspections,
    COUNT(*)                                   AS total_inspections
FROM quality_inspection
GROUP BY company_id;

COMMIT;