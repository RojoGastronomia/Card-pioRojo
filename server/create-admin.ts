import { db } from "./db";
import { users } from "shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdmin() {
  console.log("Criando usuário administrador...");

  try {
    // Verificar se já existe um admin
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"));

    if (existingAdmin.length > 0) {
      console.log("Um usuário administrador já existe com as credenciais:");
      console.log(`Email: ${existingAdmin[0].email}`);
      console.log(`Senha: admin123 (senha padrão)`);
      return;
    }

    // Criar novo admin
    const adminUser = {
      username: "admin",
      email: "admin@example.com",
      password: await hashPassword("admin123"),
      name: "Administrador",
      role: "admin",
      phone: "(11) 99999-9999"
    };

    const [createdAdmin] = await db.insert(users).values(adminUser).returning();
    
    console.log("Usuário administrador criado com sucesso!");
    console.log("Use as seguintes credenciais para login:");
    console.log(`Email: ${adminUser.email}`);
    console.log(`Senha: admin123`);
  } catch (error) {
    console.error("Erro ao criar usuário administrador:", error);
  }
}

// Executar a criação do admin
createAdmin().then(() => process.exit(0)).catch(console.error);