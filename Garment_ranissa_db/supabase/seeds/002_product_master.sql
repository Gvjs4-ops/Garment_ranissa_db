INSERT INTO product_category(category_code, category_name)
VALUES
('MEN','Men'),
('WOMEN','Women'),
('KIDS','Kids'),
('UNIFORM','Uniform'),
('ACCESSORIES','Accessories');

INSERT INTO product_group(category_id, group_code, group_name)
SELECT id,'SHIRT','Shirts'
FROM product_category
WHERE category_code='MEN';

INSERT INTO season(season_code, season_name)
VALUES
('SS25','Spring Summer'),
('FW25','Fall Winter'),
('ALL','All Season');

INSERT INTO color(color_code,color_name)
VALUES
('BLACK','Black'),
('WHITE','White'),
('NAVY','Navy'),
('RED','Red');