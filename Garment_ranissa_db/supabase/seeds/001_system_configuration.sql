----------------------------------------------------
-- Modules
----------------------------------------------------

INSERT INTO system_module(module_code,module_name,display_order)
VALUES
('MASTER','Masters',1),
('PURCHASE','Purchase',2),
('INVENTORY','Inventory',3),
('PRODUCTION','Production',4),
('SALES','Sales',5),
('COSTING','Costing',6),
('QUALITY','Quality',7),
('REPORTS','Reports',8),
('POWERBI','Power BI',9);

----------------------------------------------------
-- Feature Groups
----------------------------------------------------

INSERT INTO lookup_group(group_code,group_name)
VALUES
('GARMENT_CATEGORY','Garment Category'),
('FIT_TYPE','Fit Type'),
('SLEEVE_TYPE','Sleeve Type'),
('NECK_TYPE','Neck Type'),
('FABRIC_TYPE','Fabric Type'),
('BUTTON_TYPE','Button Type'),
('ZIPPER_TYPE','Zipper Type'),
('PRINT_TYPE','Print Type'),
('EMBROIDERY_TYPE','Embroidery Type'),
('WASH_TYPE','Wash Type');

----------------------------------------------------
-- Garment Categories
----------------------------------------------------

INSERT INTO lookup_value(group_id,value_code,value_name)
SELECT id,'MEN','Men'
FROM lookup_group
WHERE group_code='GARMENT_CATEGORY';

INSERT INTO lookup_value(group_id,value_code,value_name)
SELECT id,'WOMEN','Women'
FROM lookup_group
WHERE group_code='GARMENT_CATEGORY';

INSERT INTO lookup_value(group_id,value_code,value_name)
SELECT id,'KIDS','Kids'
FROM lookup_group
WHERE group_code='GARMENT_CATEGORY';

INSERT INTO lookup_value(group_id,value_code,value_name)
SELECT id,'SPORTS','Sportswear'
FROM lookup_group
WHERE group_code='GARMENT_CATEGORY';

INSERT INTO lookup_value(group_id,value_code,value_name)
SELECT id,'UNIFORM','Uniform'
FROM lookup_group
WHERE group_code='GARMENT_CATEGORY';