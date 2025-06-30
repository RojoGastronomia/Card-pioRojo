INSERT INTO users (username, email, password, name, role, phone, created_at, updated_at)
VALUES (
  'felipe',
  'suporte@rojogastronomia.com',
  '$2b$10$vSC1lcpIPbHUZqXjEDCsAeqtG/b/qoiO26KXkvJVlPJovW7Es0Y8m',
  'Felipe',
  'admin',
  '(99) 99999-9999',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING; 