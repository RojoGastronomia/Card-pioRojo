import { db } from "./db";
import { users } from "../shared/schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

async function createMaster() {
  console.log("Criando usuário master...");

  try {
    // Verificar se já existe um master
    const existingMaster = await db
      .select()
      .from(users)
      .where(eq(users.role, "master"));

    if (existingMaster.length > 0) {
      console.log("Um usuário master já existe com as credenciais:");
      console.log(`Email: ${existingMaster[0].email}`);
      console.log(`Senha: master123 (senha padrão)`);
      return;
    }

    // Criar novo master
    const masterUser = {
      username: "master",
      email: "master@sitecard.com",
      password: await hash("master123", 10),
      name: "Master",
      role: "master",
      phone: "(11) 99999-9999"
    };

    const [createdMaster] = await db.insert(users).values(masterUser).returning();
    
    console.log("Usuário master criado com sucesso!");
    console.log("Use as seguintes credenciais para login:");
    console.log(`Email: ${masterUser.email}`);
    console.log(`Senha: master123`);
  } catch (error) {
    console.error("Erro ao criar usuário master:", error);
  }
}

createMaster().then(() => process.exit()); 