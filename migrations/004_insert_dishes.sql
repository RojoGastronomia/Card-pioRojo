-- Insert dishes for COFFEE BREAK PREMIUM
WITH menu AS (SELECT id FROM menus WHERE name = 'COFFEE BREAK PREMIUM')
INSERT INTO dishes (name, description, category, menu_id, price) VALUES
('Café', 'Café 100% arábica, torrado e moído na hora', 'BEBIDAS', (SELECT id FROM menu), 5.00),
('Leite', 'Leite integral ou desnatado quente', 'BEBIDAS', (SELECT id FROM menu), 4.00),
('Chocolate quente', 'Chocolate quente cremoso com chocolate belga', 'BEBIDAS', (SELECT id FROM menu), 6.00),
('Suco de laranja', 'Suco de laranja natural espremido na hora', 'BEBIDAS', (SELECT id FROM menu), 5.00),
('Água mineral com e sem gás', 'Água mineral natural ou com gás em garrafas individuais', 'BEBIDAS', (SELECT id FROM menu), 3.00),
('Mini croissant', 'Mini croissant folhado e crocante', 'SNACKS', (SELECT id FROM menu), 4.50),
('Mini pão de queijo', 'Mini pão de queijo quentinho e macio', 'SNACKS', (SELECT id FROM menu), 3.50),
('Mini folhado de frango', 'Mini folhado recheado com frango cremoso', 'SNACKS', (SELECT id FROM menu), 5.00),
('Mini sanduíche de peito de peru', 'Mini sanduíche com peito de peru, queijo e alface', 'MINI SANDUICHES', (SELECT id FROM menu), 6.00),
('Mini sanduíche de presunto e queijo', 'Mini sanduíche com presunto, queijo e tomate', 'MINI SANDUICHES', (SELECT id FROM menu), 5.00),
('Bolo de chocolate', 'Bolo de chocolate fofinho com cobertura de ganache', 'BOLOS', (SELECT id FROM menu), 7.00),
('Bolo de laranja', 'Bolo de laranja com calda cítrica', 'BOLOS', (SELECT id FROM menu), 6.00),
('Mini brownie', 'Mini brownie de chocolate meio amargo', 'SOBREMESAS', (SELECT id FROM menu), 4.00),
('Petit four doce', 'Variedade de petit fours doces artesanais', 'SOBREMESAS', (SELECT id FROM menu), 3.50, );

-- Insert dishes for COFFEE BREAK STANDARD
WITH menu AS (SELECT id FROM menus WHERE name = 'COFFEE BREAK STANDARD')
INSERT INTO dishes (name, description, category, menu_id, price) VALUES
('Café', 'Café 100% arábica', 'BEBIDAS', (SELECT id FROM menu), 4.00),
('Leite', 'Leite integral ou desnatado quente', 'BEBIDAS', (SELECT id FROM menu), 3.00),
('Chocolate quente', 'Chocolate quente cremoso', 'BEBIDAS', (SELECT id FROM menu), 5.00),
('Suco de laranja', 'Suco de laranja natural', 'BEBIDAS', (SELECT id FROM menu), 4.00),
('Água mineral com e sem gás', 'Água mineral natural ou com gás', 'BEBIDAS', (SELECT id FROM menu), 2.50),
('Mini pão de queijo', 'Mini pão de queijo tradicional', 'SNACKS', (SELECT id FROM menu), 3.00),
('Mini folhado de frango', 'Mini folhado com recheio de frango', 'SNACKS', (SELECT id FROM menu), 4.00),
('Mini sanduíche de presunto e queijo', 'Mini sanduíche tradicional de presunto e queijo', 'MINI SANDUICHES', (SELECT id FROM menu), 4.50),
('Bolo de chocolate', 'Bolo de chocolate com cobertura', 'BOLOS', (SELECT id FROM menu), 6.00),
('Bolo de laranja', 'Bolo de laranja tradicional', 'BOLOS', (SELECT id FROM menu), 5.00),
('Mini brownie', 'Mini brownie de chocolate', 'SOBREMESAS', (SELECT id FROM menu), 3.50);

-- Insert dishes for COFFEE BREAK BÁSICO
WITH menu AS (SELECT id FROM menus WHERE name = 'COFFEE BREAK BÁSICO')
INSERT INTO dishes (name, description, category, menu_id, price) VALUES
('Café', 'Café tradicional', 'BEBIDAS', (SELECT id FROM menu), 3.00),
('Leite', 'Leite quente', 'BEBIDAS', (SELECT id FROM menu), 2.50),
('Água mineral com e sem gás', 'Água mineral', 'BEBIDAS', (SELECT id FROM menu), 2.00),
('Mini pão de queijo', 'Mini pão de queijo', 'SNACKS', (SELECT id FROM menu), 2.50),
('Mini sanduíche de presunto e queijo', 'Mini sanduíche simples', 'MINI SANDUICHES', (SELECT id FROM menu), 4.00),
('Bolo de chocolate', 'Bolo de chocolate simples', 'BOLOS', (SELECT id FROM menu), 5.00); 