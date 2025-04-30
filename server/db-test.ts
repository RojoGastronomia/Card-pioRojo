// Arquivo temporário para testar a conexão com o banco de dados
import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

async function testDatabaseConnection() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Configurado (protegido)" : "NÃO CONFIGURADO");
  
  if (!process.env.DATABASE_URL) {
    console.error("URL do banco de dados não configurada!");
    process.exit(1);
  }
  
  try {
    // Criar um pool de conexões padrão do pg
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1, // Limite a apenas uma conexão para este teste
      connectionTimeoutMillis: 5000, // 5 segundos de timeout
    });
    
    console.log("Tentando conectar ao banco de dados...");
    
    // Testar a conexão
    const client = await pool.connect();
    console.log("Conexão estabelecida com sucesso!");
    
    // Executar uma consulta simples
    const result = await client.query('SELECT current_timestamp as time, current_database() as database');
    console.log("Consulta executada com sucesso:");
    console.log("Hora atual no banco:", result.rows[0].time);
    console.log("Banco de dados:", result.rows[0].database);
    
    // Criar uma instância do Drizzle para testar
    const db = drizzle(pool);
    console.log("Instância do Drizzle criada com sucesso!");
    
    // Testar uma consulta com Drizzle
    try {
      console.log("Testando consulta SQL com Drizzle...");
      const sql = `SELECT count(*) FROM "users"`;
      const drizzleResult = await db.execute(sql);
      console.log("Consulta Drizzle executada com sucesso:", drizzleResult);
    } catch (drizzleError) {
      console.error("Erro ao executar consulta com Drizzle:", drizzleError);
    }
    
    // Liberar cliente e encerrar conexão
    client.release();
    await pool.end();
    
    console.log("Teste de conexão completo e bem-sucedido!");
    return true;
  } catch (error) {
    console.error("ERRO AO CONECTAR AO BANCO DE DADOS:", error);
    return false;
  }
}

// Executar o teste
testDatabaseConnection()
  .then(success => {
    console.log("Resultado do teste:", success ? "SUCESSO" : "FALHA");
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error("Erro não tratado durante o teste:", err);
    process.exit(1);
  }); 