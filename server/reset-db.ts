import { db } from './db';
import { eventMenus, menuDishes, dishes, menus, events, users } from '../shared/schema';

async function resetDatabase() {
  try {
    console.log('Inicializando banco de dados PostgreSQL...');
    console.log('Iniciando limpeza do banco de dados...');

    // Limpar tabelas na ordem correta (respeitando as chaves estrangeiras)
    await db.delete(eventMenus);
    console.log('Tabela event_menus limpa!');

    await db.delete(menuDishes);
    console.log('Tabela menu_dishes limpa!');

    await db.delete(dishes);
    console.log('Tabela dishes limpa!');

    await db.delete(menus);
    console.log('Tabela menus limpa!');

    await db.delete(events);
    console.log('Tabela events limpa!');

    await db.delete(users);
    console.log('Tabela users limpa!');

    console.log('Banco de dados resetado com sucesso!');
  } catch (error) {
    console.error('Erro ao resetar banco de dados:', error);
  }
}

resetDatabase(); 