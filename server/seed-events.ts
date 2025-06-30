import { db } from './db';
import { events } from '../shared/schema';

async function seedEvents() {
  try {
    console.log('Iniciando inserção de eventos...');

    const eventsToInsert = [
      {
        title: 'Coffee Break Empresarial',
        description: 'Coffee break para reuniões e eventos corporativos',
        imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952',
        eventType: 'corporate',
        menuOptions: 4,
        status: 'available'
      },
      {
        title: 'Coffee Break para Treinamentos',
        description: 'Coffee break para treinamentos e workshops',
        imageUrl: 'https://images.unsplash.com/photo-1552581234-26160f608093',
        eventType: 'training',
        menuOptions: 3,
        status: 'available'
      },
      {
        title: 'Café da Manhã Executivo',
        description: 'Café da manhã para reuniões executivas',
        imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666',
        eventType: 'corporate',
        menuOptions: 2,
        status: 'available'
      },
      {
        title: 'Almoço Corporativo',
        description: 'Almoço para eventos corporativos',
        imageUrl: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca',
        eventType: 'corporate',
        menuOptions: 3,
        status: 'available'
      },
      {
        title: 'Almoço para Eventos Sociais',
        description: 'Almoço para eventos sociais e confraternizações',
        imageUrl: 'https://images.unsplash.com/photo-1530062845289-9109b2c9c868',
        eventType: 'social',
        menuOptions: 2,
        status: 'available'
      },
      {
        title: 'Brunch Especial',
        description: 'Brunch para eventos especiais',
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349',
        eventType: 'social',
        menuOptions: 2,
        status: 'available'
      },
      {
        title: 'Coquetel Corporativo',
        description: 'Coquetel para eventos corporativos',
        imageUrl: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88',
        eventType: 'corporate',
        menuOptions: 2,
        status: 'available'
      },
      {
        title: 'Coquetel para Festas',
        description: 'Coquetel para festas e celebrações',
        imageUrl: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88',
        eventType: 'social',
        menuOptions: 2,
        status: 'available'
      },
      {
        title: 'Jantar de Gala',
        description: 'Jantar formal para eventos especiais',
        imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
        eventType: 'social',
        menuOptions: 3,
        status: 'available'
      },
      {
        title: 'Coffee Break para Conferências',
        description: 'Coffee break para conferências e palestras',
        imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952',
        eventType: 'conference',
        menuOptions: 4,
        status: 'available'
      },
      {
        title: 'Lanche da Tarde',
        description: 'Lanche da tarde para eventos sociais',
        imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87',
        eventType: 'social',
        menuOptions: 2,
        status: 'available'
      },
      {
        title: 'Coffee Break para Workshops',
        description: 'Coffee break para workshops e treinamentos práticos',
        imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952',
        eventType: 'training',
        menuOptions: 3,
        status: 'available'
      }
    ];

    for (const event of eventsToInsert) {
      const [insertedEvent] = await db.insert(events).values(event).returning();
      console.log(`Evento "${event.title}" inserido com sucesso!`);
    }

    console.log('Inserção de eventos concluída!');
  } catch (error) {
    console.error('Erro ao inserir eventos:', error);
  }
}

seedEvents(); 