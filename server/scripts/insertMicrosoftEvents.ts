import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { events, menus, eventMenus } from 'shared/schema';

// Configuração do banco Supabase
const DATABASE_URL = "postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres";

console.log("Conectando ao banco de dados Supabase...");
const queryClient = postgres(DATABASE_URL, { 
  max: 1,
  ssl: 'require',
  idle_timeout: 20,
  connect_timeout: 10
});

// Criar a instância do drizzle
const db = drizzle(queryClient);

// Dados dos eventos da Microsoft (ajustados para o schema atual)
const microsoftEvents = [
  {
    title: "Microsoft Ignite 2024",
    description: "Conferência anual da Microsoft para desenvolvedores e profissionais de TI",
    titleEn: "Microsoft Ignite 2024",
    descriptionEn: "Annual Microsoft conference for developers and IT professionals",
    imageUrl: "https://example.com/microsoft-ignite-2024.jpg",
    location: "Seattle, WA",
    eventType: "Conferência",
    menuOptions: 3,
    status: "available"
  },
  {
    title: "Microsoft Build 2024",
    description: "Conferência para desenvolvedores sobre as últimas tecnologias da Microsoft",
    titleEn: "Microsoft Build 2024",
    descriptionEn: "Developer conference about the latest Microsoft technologies",
    imageUrl: "https://example.com/microsoft-build-2024.jpg",
    location: "Seattle, WA",
    eventType: "Desenvolvimento",
    menuOptions: 2,
    status: "available"
  },
  {
    title: "Microsoft Inspire 2024",
    description: "Conferência para parceiros da Microsoft",
    titleEn: "Microsoft Inspire 2024",
    descriptionEn: "Microsoft partners conference",
    imageUrl: "https://example.com/microsoft-inspire-2024.jpg",
    location: "Las Vegas, NV",
    eventType: "Parcerias",
    menuOptions: 4,
    status: "available"
  }
];

// Dados dos menus da Microsoft (ajustados para o schema atual)
const microsoftMenus = [
  {
    name: "Menu Executivo Microsoft",
    description: "Menu premium com pratos selecionados para executivos",
    nameEn: "Microsoft Executive Menu",
    descriptionEn: "Premium menu with selected dishes for executives",
    price: 85.00,
    category: "Executivo",
    categoryEn: "Executive",
    image_url: "https://example.com/menu-executivo-microsoft.jpg"
  },
  {
    name: "Menu Vegetariano Microsoft",
    description: "Opções vegetarianas e veganas para todos os gostos",
    nameEn: "Microsoft Vegetarian Menu",
    descriptionEn: "Vegetarian and vegan options for all tastes",
    price: 65.00,
    category: "Vegetariano",
    categoryEn: "Vegetarian",
    image_url: "https://example.com/menu-vegetariano-microsoft.jpg"
  },
  {
    name: "Menu Internacional Microsoft",
    description: "Culinária internacional com pratos de diferentes países",
    nameEn: "Microsoft International Menu",
    descriptionEn: "International cuisine with dishes from different countries",
    price: 75.00,
    category: "Internacional",
    categoryEn: "International",
    image_url: "https://example.com/menu-internacional-microsoft.jpg"
  },
  {
    name: "Menu Executivo Premium",
    description: "Menu de luxo com pratos gourmet e bebidas premium",
    nameEn: "Premium Executive Menu",
    descriptionEn: "Luxury menu with gourmet dishes and premium beverages",
    price: 120.00,
    category: "Premium",
    categoryEn: "Premium",
    image_url: "https://example.com/menu-executivo-premium.jpg"
  },
  {
    name: "Menu Vegetariano Premium",
    description: "Opções vegetarianas gourmet com ingredientes orgânicos",
    nameEn: "Premium Vegetarian Menu",
    descriptionEn: "Gourmet vegetarian options with organic ingredients",
    price: 95.00,
    category: "Vegetariano Premium",
    categoryEn: "Premium Vegetarian",
    image_url: "https://example.com/menu-vegetariano-premium.jpg"
  },
  {
    name: "Menu Internacional Premium",
    description: "Culinária internacional gourmet com pratos exclusivos",
    nameEn: "Premium International Menu",
    descriptionEn: "Gourmet international cuisine with exclusive dishes",
    price: 110.00,
    category: "Internacional Premium",
    categoryEn: "Premium International",
    image_url: "https://example.com/menu-internacional-premium.jpg"
  }
];

async function insertMicrosoftData() {
  try {
    console.log('Iniciando inserção dos dados da Microsoft...');

    // Inserir eventos
    console.log('Inserindo eventos...');
    const insertedEvents = [];
    for (const event of microsoftEvents) {
      const [insertedEvent] = await db.insert(events).values(event).returning();
      insertedEvents.push(insertedEvent);
      console.log(`Evento inserido: ${insertedEvent.title} (ID: ${insertedEvent.id})`);
    }

    // Inserir menus
    console.log('Inserindo menus...');
    const insertedMenus = [];
    for (const menu of microsoftMenus) {
      const [insertedMenu] = await db.insert(menus).values(menu).returning();
      insertedMenus.push(insertedMenu);
      console.log(`Menu inserido: ${insertedMenu.name} (ID: ${insertedMenu.id})`);
    }

    // Associar menus aos eventos
    console.log('Associando menus aos eventos...');
    for (const event of insertedEvents) {
      // Associar todos os menus a cada evento
      for (const menu of insertedMenus) {
        await db.insert(eventMenus).values({
          eventId: event.id,
          menuId: menu.id
        });
        console.log(`Menu "${menu.name}" associado ao evento "${event.title}"`);
      }
    }

    console.log('✅ Dados da Microsoft inseridos com sucesso!');
    console.log(`📊 Resumo:`);
    console.log(`   - ${insertedEvents.length} eventos inseridos`);
    console.log(`   - ${insertedMenus.length} menus inseridos`);
    console.log(`   - ${insertedEvents.length * insertedMenus.length} associações evento-menu criadas`);

  } catch (error) {
    console.error('❌ Erro ao inserir dados:', error);
  } finally {
    await queryClient.end();
  }
}

// Executar o script
insertMicrosoftData(); 