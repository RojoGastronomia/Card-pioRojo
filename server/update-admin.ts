import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function updateAdmin() {
  console.log("Atualizando usuário administrador...");

  try {
    // Atualizar o papel do usuário admin
    const [updatedAdmin] = await db
      .update(users)
      .set({ role: "Administrador" })
      .where(eq(users.email, "suporte@rojogastronomia.com"))
      .returning();

    if (updatedAdmin) {
      console.log("Usuário administrador atualizado com sucesso!");
      console.log("Use as seguintes credenciais para login:");
      console.log(`Email: suporte@rojogastronomia.com`);
      console.log(`Senha: 03032012FeKa<3`);
    } else {
      console.log("Usuário administrador não encontrado!");
    }
  } catch (error) {
    console.error("Erro ao atualizar usuário administrador:", error);
  }
}

// Executar a atualização
updateAdmin().then(() => process.exit(0)).catch(console.error); 