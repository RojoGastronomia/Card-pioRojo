import { db } from "./db";
import { events, menus, users } from "../shared/schema";
import { hash } from "bcryptjs";

async function seed() {
  // Create admin user if doesn't exist
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, adminEmail),
    });

    if (!existingAdmin) {
      const hashedPassword = await hash(adminPassword, 10);
      await db.insert(users).values({
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        username: "admin",
        name: "Administrador"
      });
      console.log("Admin user created successfully");
    }
  }

  console.log("Seeding database...");

  // Limpar dados existentes (opcional)
  // await db.delete(menuItems);
  // await db.delete(events);

  try {
    // Verificar se já existem eventos no banco
    const existingEvents = await db.select().from(events);
    if (existingEvents.length > 0) {
      console.log("Database already has data, skipping seed...");
      return;
    }

    // Event 1
    const [event1] = await db.insert(events).values({
      title: "Pacote Almoço Corporativo",
      description: "Serviço completo de catering para almoços corporativos. Inclui opções de menu, serviço de garçom e montagem.",
      status: "available",
      eventType: "corporate",
      imageUrl: "https://public.readdy.ai/ai/img_res/68a2ff7ee6f61f6c6b0f78ca78bc5f13.jpg",
      menuOptions: 2,
    }).returning();

    // Menu items for Event 1
    await db.insert(menus).values([
      {
        name: "Menu Executivo",
        nameEn: "Executive Menu",
        description: "Menu completo com entrada, prato principal e sobremesa. Opções de carne, frango e vegetariano.",
        descriptionEn: "Full menu with starter, main course and dessert. Meat, chicken and vegetarian options.",
        price: 80,
        image_url: "https://via.placeholder.com/300x200?text=Menu+Executivo",
        eventId: event1.id,
      },
      {
        name: "Menu Premium",
        nameEn: "Premium Menu",
        description: "Menu premium com entrada, prato principal gourmet, sobremesa e bebidas inclusas. Diversas opções disponíveis.",
        descriptionEn: "Premium menu with starter, gourmet main course, dessert and drinks included. Several options available.",
        price: 120,
        image_url: "https://via.placeholder.com/300x200?text=Menu+Premium",
        eventId: event1.id,
      }
    ]);

    // Event 2
    const [event2] = await db.insert(events).values({
      title: "Casamento",
      description: "Serviço de catering completo para casamentos. Inclui coquetel de entrada, jantar, sobremesa e open bar.",
      status: "available",
      eventType: "wedding",
      imageUrl: "https://public.readdy.ai/ai/img_res/6f8df1bd2a80878edaccbfb15a0a1a93.jpg",
      menuOptions: 3,
    }).returning();

    // Menu items for Event 2
    await db.insert(menus).values([
      {
        name: "Menu Clássico",
        nameEn: "Classic Menu",
        description: "Menu tradicional com entrada, prato principal e sobremesa. Opções de carne, frango e peixe.",
        descriptionEn: "Traditional menu with starter, main course and dessert. Meat, chicken and fish options.",
        price: 150,
        image_url: "https://via.placeholder.com/300x200?text=Menu+Classico",
        eventId: event2.id,
      },
      {
        name: "Menu Gourmet",
        nameEn: "Gourmet Menu",
        description: "Menu gourmet com 5 tempos: entrada fria, entrada quente, prato principal, pre-sobremesa e sobremesa.",
        descriptionEn: "Gourmet menu with 5 courses: cold starter, hot starter, main course, pre-dessert and dessert.",
        price: 250,
        image_url: "https://via.placeholder.com/300x200?text=Menu+Gourmet",
        eventId: event2.id,
      },
      {
        name: "Menu Internacional",
        nameEn: "International Menu",
        description: "Menu exclusivo com pratos da gastronomia internacional, produtos premium e open bar completo.",
        descriptionEn: "Exclusive menu with international cuisine, premium products and full open bar.",
        price: 350,
        image_url: "https://via.placeholder.com/300x200?text=Menu+Internacional",
        eventId: event2.id,
      }
    ]);

    // Event 3
    const [event3] = await db.insert(events).values({
      title: "Aniversário",
      description: "Buffet completo para festas de aniversário. Diversas opções de cardápio e temas.",
      status: "available",
      eventType: "birthday",
      imageUrl: "https://public.readdy.ai/ai/img_res/73f50ccacb2c3c2fba36fe1f8ea8f96c.jpg",
      menuOptions: 2,
    }).returning();

    // Menu items for Event 3
    await db.insert(menus).values([
      {
        name: "Menu Festa",
        nameEn: "Party Menu",
        description: "Buffet completo com finger foods, mini-porções, mesa de doces e bolo personalizado.",
        descriptionEn: "Full buffet with finger foods, mini portions, candy table and personalized cake.",
        price: 100,
        image_url: "https://via.placeholder.com/300x200?text=Menu+Festa",
        eventId: event3.id,
      },
      {
        name: "Menu Premium Celebration",
        nameEn: "Premium Celebration Menu",
        description: "Menu premium com estações gastronômicas, carnes nobres, doces finos e bebidas premium.",
        descriptionEn: "Premium menu with food stations, fine meats, fine sweets and premium drinks.",
        price: 180,
        image_url: "https://via.placeholder.com/300x200?text=Menu+Premium+Celebration",
        eventId: event3.id,
      }
    ]);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Executar o seed
seed().then(() => process.exit(0)).catch(console.error);