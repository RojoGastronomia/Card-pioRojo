import { db } from "./db";
import { users } from "../shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function createAdmin() {
  console.log("Criando usuário administrador...");

  try {
    // Verificar se já existe um admin
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.role, "Administrador"))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("Um usuário administrador já existe com as credenciais:");
      console.log(`Email: ${existingAdmin[0].email}`);
      return;
    }

    // Criar novo admin
    const adminPassword = await bcrypt.hash("Admin@123", 10);
    const [admin] = await db.insert(users).values({
      username: "admin",
      email: "admin@sitecard.com",
      password: adminPassword,
      name: "Administrador",
      role: "Administrador",
      phone: "(11) 99999-9999"
    }).returning();
    
    console.log("Usuário administrador criado com sucesso!");
    console.log("Use as seguintes credenciais para login:");
    console.log(`Email: admin@sitecard.com`);
    console.log(`Senha: Admin@123`);
  } catch (error) {
    console.error("Erro ao criar usuário administrador:", error);
  }
}

// Executar a criação do admin
createAdmin().then(() => process.exit(0)).catch(console.error);