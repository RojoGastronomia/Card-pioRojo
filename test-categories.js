require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
 
client.connect()
  .then(() => client.query('SELECT * FROM categories LIMIT 1'))
  .then(res => { console.log('OK, tabela existe:', res.rows); client.end(); })
  .catch(err => { console.error('Erro:', err); client.end(); }); 