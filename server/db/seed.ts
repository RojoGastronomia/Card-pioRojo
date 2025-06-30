import { db } from './db';
import { users } from 'shared/schema';
import { hashPassword } from '../auth';
import { ROLES } from '../config';
import { eq } from 'drizzle-orm';

async function createMasterUser() {
  try {
    console.log('Criando usuário master...');
    
    const masterUser = {
      username: 'master',
      email: 'master@sitecard.com',
      password: await hashPassword('Master@123'),
      name: 'Master User',
      role: ROLES.MASTER,
    };

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, masterUser.email)
    });
    
    if (existingUser) {
      console.log('Usuário master já existe, atualizando senha...');
      await db.update(users)
        .set({ password: masterUser.password })
        .where(eq(users.email, masterUser.email));
      console.log('Senha do master atualizada!');
      return;
    }

    await db.insert(users).values(masterUser);
    console.log('Usuário master criado com sucesso');
  } catch (error) {
    console.error('Erro ao criar usuário master:', error);
  }
}

// Executar o script
createMasterUser(); 