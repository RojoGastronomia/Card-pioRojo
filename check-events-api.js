const https = require('https');
const http = require('http');

async function checkEventsAPI() {
  try {
    console.log('Buscando eventos via API...');
    
    const data = await new Promise((resolve, reject) => {
      const req = http.request('http://localhost:5000/api/events', (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });
      
      req.on('error', (err) => {
        reject(err);
      });
      
      req.end();
    });
    
    const events = data;
    console.log(`\nTotal de eventos encontrados: ${events.length}`);
    
    // Verificar duplicatas por título
    const titles = events.map(e => e.title);
    const uniqueTitles = [...new Set(titles)];
    
    console.log(`\nTítulos únicos: ${uniqueTitles.length}`);
    console.log(`Títulos duplicados: ${titles.length - uniqueTitles.length}`);
    
    if (titles.length !== uniqueTitles.length) {
      console.log('\n=== EVENTOS DUPLICADOS ===');
      const duplicates = titles.filter((title, index) => titles.indexOf(title) !== index);
      const uniqueDuplicates = [...new Set(duplicates)];
      
      uniqueDuplicates.forEach(title => {
        const eventsWithTitle = events.filter(e => e.title === title);
        console.log(`\nTítulo: "${title}"`);
        console.log(`Quantidade: ${eventsWithTitle.length}`);
        eventsWithTitle.forEach(e => {
          console.log(`  - ID: ${e.id}, Status: ${e.status}, Criado: ${e.createdAt}`);
        });
      });
    }
    
    // Mostrar todos os eventos
    console.log('\n=== TODOS OS EVENTOS ===');
    events.forEach(e => {
      console.log(`ID: ${e.id} | Título: "${e.title}" | Status: ${e.status} | Criado: ${e.createdAt}`);
    });
    
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
  }
}

checkEventsAPI(); 