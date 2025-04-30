import { db } from './db';
import { users } from 'shared/schema';
import { eq } from 'drizzle-orm';
import logger from './logger';

async function fixAdminUser() {
  try {
    console.log("Iniciando correção do usuário administrador...");
    
    // Verificar se o usuário admin existe
    const [adminUser] = await db.select().from(users).where(eq(users.email, 'admin@exemplo.com'));
    
    if (!adminUser) {
      console.log("Usuário admin não encontrado! Criando usuário administrador...");
      // Criar usuário admin se não existir
      const newAdmin = await db.insert(users).values({
        username: 'admin',
        email: 'admin@exemplo.com',
        password: '$2b$10$hACwlL/j.HJsNUBSX/FrXOMZrKrIuHn4BtO1MQWOQRGz54Wr7jEsW', // Senha: admin123
        role: 'Administrador',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      console.log("Usuário admin criado com sucesso:", newAdmin[0]);
      return;
    }
    
    // Verificar se o papel do usuário admin está correto
    if (adminUser.role !== 'Administrador') {
      console.log(`Corrigindo papel do usuário admin (atual: ${adminUser.role})...`);
      
      // Atualizar papel para Administrador
      const [updatedAdmin] = await db.update(users)
        .set({ role: 'Administrador', updatedAt: new Date() })
        .where(eq(users.id, adminUser.id))
        .returning();
      
      console.log("Usuário admin corrigido com sucesso:", updatedAdmin);
    } else {
      console.log("Usuário admin já está com o papel correto:", adminUser);
    }
    
    // Mostrar todos os usuários para diagnóstico
    const allUsers = await db.select().from(users);
    console.log("Lista de todos os usuários no sistema:");
    allUsers.forEach((user) => {
      console.log(`ID: ${user.id}, Nome: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error("Erro ao corrigir usuário admin:", error);
  }
}

// Executar função diretamente se este script for chamado diretamente
if (require.main === module) {
  fixAdminUser()
    .then(() => {
      console.log("Script de correção concluído.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Erro fatal ao executar script:", error);
      process.exit(1);
    });
} else {
  // Exportar função para uso em outros scripts
  module.exports = { fixAdminUser };
} 