import { db } from './db';
import { events } from '../shared/schema';

async function checkEvents() {
  try {
    console.log('Buscando eventos no banco de dados...');
    const allEvents = await db.select().from(events);
    console.log('Eventos encontrados:', allEvents);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
  }
}

checkEvents(); 