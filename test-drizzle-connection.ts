require('dotenv').config();
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    await client.connect();
    const res = await client.query("SELECT NOW()");
    console.log("Conexão bem-sucedida! Horário do banco:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("Erro ao conectar:", err);
  }
}

main(); 