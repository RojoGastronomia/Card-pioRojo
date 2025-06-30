const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

sql`SELECT * FROM categories LIMIT 1`
  .then(res => {
    console.log('OK postgres:', res);
    process.exit(0);
  })
  .catch(err => {
    console.error('Erro postgres:', err);
    process.exit(1);
  }); 