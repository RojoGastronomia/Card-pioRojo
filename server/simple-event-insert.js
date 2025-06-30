import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres'
});

async function insertSimpleEvent() {
  try {
    console.log('Inserindo evento simples via SQL...');
    
    const result = await pool.query(`
      INSERT INTO events (
        title, 
        description, 
        title_en, 
        description_en, 
        image_url, 
        location, 
        event_type, 
        menu_options, 
        status
      ) VALUES (
        'Coffee Break Empresarial',
        'Coffee break para eventos empresariais',
        'Business Coffee Break',
        'Coffee break for business events',
        'https://via.placeholder.com/300x200',
        'São Paulo, SP',
        'coffee_break',
        2,
        'available'
      ) RETURNING *
    `);
    
    console.log('✅ Evento inserido com sucesso:', result.rows[0]);
    
    // Verificar todos os eventos
    const allEvents = await pool.query('SELECT * FROM events');
    console.log(`📋 Total de eventos no banco: ${allEvents.rows.length}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

insertSimpleEvent(); 