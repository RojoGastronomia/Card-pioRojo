import { db } from "./db";
import { users } from "shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createBaseUsers() {
  console.log("Criando usuários base...");

  try {
    // Limpar usuários existentes
    await db.delete(users);

    const baseUsers = [
      {
        username: "cliente_demo",
        email: "cliente@exemplo.com",
        name: "Cliente Demo",
        role: "client",
        phone: "11999999991"
      },
      {
        username: "colaborador_demo",
        email: "colaborador@exemplo.com",
        name: "Colaborador Demo",
        role: "Colaborador",
        phone: "11999999992"
      },
      {
        username: "lider_demo",
        email: "lider@exemplo.com",
        name: "Líder Demo",
        role: "Lider",
        phone: "11999999993"
      },
      {
        username: "gerente_demo",
        email: "gerente@exemplo.com",
        name: "Gerente Demo",
        role: "Gerente",
        phone: "11999999994"
      },
      {
        username: "admin_demo",
        email: "admin@exemplo.com",
        name: "Administrador Demo",
        role: "Administrador",
        phone: "11999999995"
      }
    ];

    // Criar usuários com a senha padrão "123456"
    for (const userData of baseUsers) {
      const hashedPassword = await hashPassword("123456");
      await db.insert(users).values({
        ...userData,
        password: hashedPassword
      });
      console.log(`Usuário ${userData.name} criado com sucesso!`);
    }

    console.log("\nTodos os usuários foram criados com a senha: 123456");
    console.log("\nUsuários disponíveis:");
    console.log("- Cliente: cliente@exemplo.com");
    console.log("- Colaborador: colaborador@exemplo.com");
    console.log("- Líder: lider@exemplo.com");
    console.log("- Gerente: gerente@exemplo.com");
    console.log("- Administrador: admin@exemplo.com");

  } catch (error) {
    console.error("Erro ao criar usuários base:", error);
  }
}

// Executar a criação dos usuários
createBaseUsers(); 