import { db } from './db';
import { menus } from '../shared/schema';

async function checkMenus() {
  try {
    console.log('Buscando menus no banco de dados...');
    const allMenus = await db.select().from(menus);
    console.log('Menus encontrados:', allMenus);
  } catch (error) {
    console.error('Erro ao buscar menus:', error);
  }
}

checkMenus(); 