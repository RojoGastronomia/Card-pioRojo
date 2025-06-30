import { db } from './db';
import { eventMenus } from '../shared/schema';

async function seedEventMenus() {
  try {
    console.log('Iniciando vinculação de menus aos eventos...');

    // Coffee Break Básico e Premium
    await db.insert(eventMenus).values([
      { eventId: 117, menuId: 60 }, // Coffee Break Empresarial -> Coffee Break Básico
      { eventId: 117, menuId: 61 }, // Coffee Break Empresarial -> Coffee Break Premium
      { eventId: 118, menuId: 60 }, // Coffee Break para Treinamentos -> Coffee Break Básico
      { eventId: 118, menuId: 61 }, // Coffee Break para Treinamentos -> Coffee Break Premium
      { eventId: 126, menuId: 70 }, // Coffee Break para Conferências -> Coffee Break para Conferências
      { eventId: 128, menuId: 71 }, // Coffee Break para Workshops -> Coffee Break para Workshops
    ]);

    // Café da Manhã
    await db.insert(eventMenus).values([
      { eventId: 119, menuId: 62 }, // Café da Manhã Executivo -> Café da Manhã Básico
    ]);

    // Almoço
    await db.insert(eventMenus).values([
      { eventId: 120, menuId: 63 }, // Almoço Corporativo -> Almoço Corporativo Básico
      { eventId: 120, menuId: 64 }, // Almoço Corporativo -> Almoço Corporativo Premium
      { eventId: 121, menuId: 63 }, // Almoço para Eventos Sociais -> Almoço Corporativo Básico
      { eventId: 121, menuId: 64 }, // Almoço para Eventos Sociais -> Almoço Corporativo Premium
    ]);

    // Brunch
    await db.insert(eventMenus).values([
      { eventId: 122, menuId: 65 }, // Brunch Especial -> Brunch Básico
    ]);

    // Coquetel
    await db.insert(eventMenus).values([
      { eventId: 123, menuId: 66 }, // Coquetel Corporativo -> Coquetel Básico
      { eventId: 123, menuId: 67 }, // Coquetel Corporativo -> Coquetel Premium
      { eventId: 124, menuId: 66 }, // Coquetel para Festas -> Coquetel Básico
      { eventId: 124, menuId: 67 }, // Coquetel para Festas -> Coquetel Premium
    ]);

    // Jantar de Gala
    await db.insert(eventMenus).values([
      { eventId: 125, menuId: 68 }, // Jantar de Gala -> Jantar de Gala
    ]);

    // Lanche da Tarde
    await db.insert(eventMenus).values([
      { eventId: 127, menuId: 69 }, // Lanche da Tarde -> Lanche da Tarde
    ]);

    console.log('Vinculação de menus aos eventos concluída!');
  } catch (error) {
    console.error('Erro ao vincular menus aos eventos:', error);
  }
}

seedEventMenus(); 