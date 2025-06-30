import { db } from '../db';
import { events, menus, dishes, eventMenus, menuDishes } from '../../shared/schema';

async function seedDemoData() {
  try {
    console.log('Inserindo evento de exemplo...');
    // 1. Evento
    const [event] = await db.insert(events).values({
      title: 'Evento de Demonstração',
      description: 'Este é um evento de exemplo para apresentação.',
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      eventType: 'corporate',
      menuOptions: 1,
      status: 'available',
    }).returning();

    console.log('Evento criado:', event);

    // 2. Menu
    const [menu] = await db.insert(menus).values({
      name: 'Menu Exemplo Standard',
      description: 'Menu de demonstração com pratos variados.',
      price: 99.90,
      imageUrl: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=600&q=80',
    }).returning();

    console.log('Menu criado:', menu);

    // 3. Relacionar menu ao evento
    await db.insert(eventMenus).values({
      eventId: event.id,
      menuId: menu.id,
    });

    // 4. Pratos (dishes)
    const demoDishes = [
      {
        name: 'Salada Caprese',
        description: 'Tomate, mussarela de búfala, manjericão e azeite.',
        category: 'Entrada',
        imageUrl: 'https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Risoto de Cogumelos',
        description: 'Risoto cremoso com mix de cogumelos frescos.',
        category: 'Prato Principal',
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Tiramisu',
        description: 'Sobremesa clássica italiana com café e cacau.',
        category: 'Sobremesa',
        imageUrl: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=600&q=80',
      },
    ];

    for (const dish of demoDishes) {
      const [insertedDish] = await db.insert(dishes).values({
        ...dish,
        imageUrl: dish.imageUrl,
      }).returning();
      // Relacionar prato ao menu
      await db.insert(menuDishes).values({
        menuId: menu.id,
        dishId: insertedDish.id,
      });
      console.log('Prato criado:', insertedDish);
    }

    console.log('Dados de demonstração inseridos com sucesso!');
  } catch (error) {
    console.error('Erro ao inserir dados de demonstração:', error);
  }
}

seedDemoData(); 