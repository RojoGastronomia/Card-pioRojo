import { db } from './db';
import { users } from '../shared/schema';
import { hash } from 'bcryptjs';

async function seedUsers() {
  try {
    console.log('Iniciando inserção de usuários...');

    // Criar usuário administrador
    const adminPassword = await hash('03032012FeKa<3', 10);
    const [admin] = await db.insert(users).values({
      name: 'Felipe',
      username: 'Felipe',
      email: 'suporte@rojogastronomia.com',
      password: adminPassword,
      role: 'Administrador',
      status: 'active'
    }).returning();

    console.log('Usuário administrador criado com sucesso!');
    console.log('Nome: Felipe');
    console.log('Username: felipe.rojo');
    console.log('Email: felipe.rojo@rojogastronomia.com');
    console.log('Senha: 03032012FeKa<3');

  } catch (error) {
    console.error('Erro ao inserir usuários:', error);
  }
}

seedUsers(); 