const { db } = require('./server/db');
const { events } = require('./shared/schema');

async function checkEvents() {
  try {
    console.log('Buscando eventos no banco de dados...');
    const allEvents = await db.select().from(events);
    
    console.log(`\nTotal de eventos encontrados: ${allEvents.length}`);
    
    // Verificar duplicatas por título
    const titles = allEvents.map(e => e.title);
    const uniqueTitles = [...new Set(titles)];
    
    console.log(`\nTítulos únicos: ${uniqueTitles.length}`);
    console.log(`Títulos duplicados: ${titles.length - uniqueTitles.length}`);
    
    if (titles.length !== uniqueTitles.length) {
      console.log('\n=== EVENTOS DUPLICADOS ===');
      const duplicates = titles.filter((title, index) => titles.indexOf(title) !== index);
      const uniqueDuplicates = [...new Set(duplicates)];
      
      uniqueDuplicates.forEach(title => {
        const eventsWithTitle = allEvents.filter(e => e.title === title);
        console.log(`\nTítulo: "${title}"`);
        console.log(`Quantidade: ${eventsWithTitle.length}`);
        eventsWithTitle.forEach(e => {
          console.log(`  - ID: ${e.id}, Status: ${e.status}, Criado: ${e.createdAt}`);
        });
      });
    }
    
    // Mostrar todos os eventos
    console.log('\n=== TODOS OS EVENTOS ===');
    allEvents.forEach(e => {
      console.log(`ID: ${e.id} | Título: "${e.title}" | Status: ${e.status} | Criado: ${e.createdAt}`);
    });
    
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
  } finally {
    process.exit(0);
  }
}

checkEvents(); 