import { db } from './db';
import { users } from '../shared/schema';

async function checkUsers() {
  try {
    console.log('Buscando usuários no banco de dados...');
    const allUsers = await db.select().from(users);
    console.log('Usuários encontrados:', allUsers);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
  }
}

checkUsers(); 