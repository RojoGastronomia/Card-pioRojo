import { db } from './db.ts';
import { events } from '../shared/schema.js';

async function testDrizzleInsert() {
  try {
    console.log('Testando inserção com Drizzle ORM...');
    
    // Tentar inserir um evento de teste
    const newEvent = await db.insert(events).values({
      title: 'Teste de Evento',
      description: 'Evento de teste para verificar se o Drizzle está funcionando',
      titleEn: 'Test Event',
      descriptionEn: 'Test event to check if Drizzle is working',
      imageUrl: 'https://via.placeholder.com/300x200',
      location: 'Local de Teste',
      eventType: 'test',
      menuOptions: 2,
      status: 'available'
    }).returning();
    
    console.log('✅ Evento inserido com sucesso:', newEvent[0]);
    
    // Buscar todos os eventos
    const allEvents = await db.select().from(events);
    console.log(`📋 Total de eventos no banco: ${allEvents.length}`);
    
  } catch (error) {
    console.error('❌ Erro ao inserir evento:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDrizzleInsert(); 