import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { events } from 'shared/schema';

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

// Eventos de exemplo simples
const sampleEvents = [
  {
    title: "Jantar de Gala",
    description: "Uma noite especial com menu gourmet e ambiente sofisticado",
    titleEn: "Gala Dinner",
    descriptionEn: "A special evening with gourmet menu and sophisticated atmosphere",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
    location: "São Paulo, SP",
    eventType: "Gala",
    menuOptions: 3,
    status: "available"
  },
  {
    title: "Conferência Empresarial",
    description: "Evento corporativo com coffee break e almoço executivo",
    titleEn: "Business Conference",
    descriptionEn: "Corporate event with coffee break and executive lunch",
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800",
    location: "Rio de Janeiro, RJ",
    eventType: "Corporativo",
    menuOptions: 2,
    status: "available"
  },
  {
    title: "Casamento Tradicional",
    description: "Celebração de casamento com menu personalizado",
    titleEn: "Traditional Wedding",
    descriptionEn: "Wedding celebration with personalized menu",
    imageUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800",
    location: "Belo Horizonte, MG",
    eventType: "Casamento",
    menuOptions: 4,
    status: "available"
  }
];

async function insertSampleEvents() {
  try {
    console.log('Iniciando inserção de eventos de exemplo...');

    // Inserir eventos
    console.log('Inserindo eventos...');
    for (const event of sampleEvents) {
      const [insertedEvent] = await db.insert(events).values(event).returning();
      console.log(`✅ Evento inserido: ${insertedEvent.title} (ID: ${insertedEvent.id})`);
    }

    console.log('✅ Eventos de exemplo inseridos com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao inserir eventos:', error);
  } finally {
    await queryClient.end();
  }
}

// Executar o script
insertSampleEvents();
