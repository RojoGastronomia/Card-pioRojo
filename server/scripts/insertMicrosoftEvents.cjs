const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { eq } = require('drizzle-orm');
const path = require('path');

// Configuração do pool de conexão
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/sitecard',
});

// Importar o schema do módulo shared
const { events, menus, eventMenus } = require('shared/schema.ts');

// Criar a instância do drizzle
const db = drizzle(pool, { schema });

async function insertMicrosoftEvents() {
  console.log('Iniciando inserção dos eventos e menus da Microsoft...');

  try {
    // Primeiro, vamos criar as categorias necessárias
    console.log('Criando categorias...');
    
    const categoryData = [
      { name: 'Almoço', nameEn: 'Lunch' },
      { name: 'Café da Manhã', nameEn: 'Breakfast' },
      { name: 'Coffee Break', nameEn: 'Coffee Break' },
      { name: 'Coquetel', nameEn: 'Cocktail' },
      { name: 'Ilha Gastronômica', nameEn: 'Gastronomic Island' },
      { name: 'Lunch Box', nameEn: 'Lunch Box' },
      { name: 'Brunch', nameEn: 'Brunch' }
    ];

    for (const cat of categoryData) {
      await db.insert(schema.categories).values(cat).onConflictDoNothing();
    }

    // Agora vamos inserir os eventos
    const eventData = [
      {
        title: 'Almoço em Buffet - Standard',
        titleEn: 'Lunch Buffet - Standard',
        description: 'Almoço em buffet com 1 salada, 1 prato principal, 2 acompanhamentos, 1 fruta ou sobremesa. Inclui bebidas não alcoólicas.',
        descriptionEn: 'Lunch buffet with 1 salad, 1 main dish, 2 sides, 1 fruit or dessert. Includes non-alcoholic beverages.',
        imageUrl: '/images/events/lunch-standard.jpg',
        location: 'São Paulo, SP',
        eventType: 'buffet',
        menuOptions: 1,
        status: 'active'
      },
      {
        title: 'Almoço em Buffet - VIP',
        titleEn: 'Lunch Buffet - VIP',
        description: 'Almoço em buffet VIP com 1 salada, 1 prato principal, 2 acompanhamentos, 1 sobremesa + frutas da estação. Inclui bebidas não alcoólicas.',
        descriptionEn: 'VIP lunch buffet with 1 salad, 1 main dish, 2 sides, 1 dessert + seasonal fruits. Includes non-alcoholic beverages.',
        imageUrl: '/images/events/lunch-vip.jpg',
        location: 'São Paulo, SP',
        eventType: 'buffet',
        menuOptions: 1,
        status: 'active'
      },
      {
        title: 'Almoço Premium',
        titleEn: 'Premium Lunch',
        description: 'Almoço premium com 2 saladas, 2 pratos principais premium, 1 acompanhamento premium, 2 sobremesas, frutas da estação.',
        descriptionEn: 'Premium lunch with 2 salads, 2 premium main dishes, 1 premium side, 2 desserts, seasonal fruits.',
        imageUrl: '/images/events/lunch-premium.jpg',
        location: 'São Paulo, SP',
        eventType: 'buffet',
        menuOptions: 1,
        status: 'active'
      },
      {
        title: 'Almoço Empratado - 3 Tempos',
        titleEn: 'Plated Lunch - 3 Courses',
        description: 'Almoço empratado com 1 entrada fria, 1 prato principal, 1 sobremesa. Menu único para todos os convidados.',
        descriptionEn: 'Plated lunch with 1 cold starter, 1 main dish, 1 dessert. Single menu for all guests.',
        imageUrl: '/images/events/lunch-plated.jpg',
        location: 'São Paulo, SP',
        eventType: 'plated',
        menuOptions: 1,
        status: 'active'
      },
      {
        title: 'Brunch',
        titleEn: 'Brunch',
        description: 'Brunch com 2 snacks, 2 saladas, 1 torta, 1 quiche, 1 massa, 2 sobremesas + frutas da estação.',
        descriptionEn: 'Brunch with 2 snacks, 2 salads, 1 pie, 1 quiche, 1 pasta, 2 desserts + seasonal fruits.',
        imageUrl: '/images/events/brunch.jpg',
        location: 'São Paulo, SP',
        eventType: 'buffet',
        menuOptions: 1,
        status: 'active'
      },
      {
        title: 'Café da Manhã Standard',
        titleEn: 'Standard Breakfast',
        description: 'Café da manhã com água, café, leite, chás, chocolate, 1 suco, 2 mini-sanduíches, 1 bolo, frutas da estação.',
        descriptionEn: 'Breakfast with water, coffee, milk, teas, chocolate, 1 juice, 2 mini-sandwiches, 1 cake, seasonal fruits.',
        imageUrl: '/images/events/breakfast-standard.jpg',
        location: 'São Paulo, SP',
        eventType: 'buffet',
        menuOptions: 1,
        status: 'active'
      },
      {
        title: 'Café da Manhã Premium',
        titleEn: 'Premium Breakfast',
        description: 'Café da manhã premium com água aromatizada, café, leite, chás, chocolate, iogurte, 2 sucos, 2 mini-sanduíches, 3 snacks, 1 mini doce, 1 bolo, frutas da estação.',
        descriptionEn: 'Premium breakfast with flavored water, coffee, milk, teas, chocolate, yogurt, 2 juices, 2 mini-sandwiches, 3 snacks, 1 mini dessert, 1 cake, seasonal fruits.',
        imageUrl: '/images/events/breakfast-premium.jpg',
        location: 'São Paulo, SP',
        eventType: 'buffet',
        menuOptions: 1,
        status: 'active'
      },
      {
        title: 'Coffee Break Básico',
        titleEn: 'Basic Coffee Break',
        description: 'Coffee break básico com água, café, chás variados, petit fours ou pão de queijo tradicional.',
        descriptionEn: 'Basic coffee break with water, coffee, various teas, petit fours or traditional cheese bread.',
        imageUrl: '/images/events/coffee-basic.jpg',
        location: 'São Paulo, SP',
        eventType: 'buffet',
        menuOptions: 1,
        status: 'active'
      },
      {
        title: 'Coffee Break Standard',
        titleEn: 'Standard Coffee Break',
        description: 'Coffee break standard com água, café, leite, chás, 1 suco, 1 mini-sanduíche, 1 snack, 1 bolo, frutas da estação.',
        descriptionEn: 'Standard coffee break with water, coffee, milk, teas, 1 juice, 1 mini-sandwich, 1 snack, 1 cake, seasonal fruits.',
        imageUrl: '/images/events/coffee-standard.jpg',
        location: 'São Paulo, SP',
        eventType: 'buffet',
        menuOptions: 1,
        status: 'active'
      },
      {
        title: 'Coffee Break VIP',
        titleEn: 'VIP Coffee Break',
        description: 'Coffee break VIP com água, café, leite, chás, chocolate, 2 sucos, 1 mini sanduíche, 1 snack, 2 mini doces, 1 bolo, fruta da estação.',
        descriptionEn: 'VIP coffee break with water, coffee, milk, teas, chocolate, 2 juices, 1 mini sandwich, 1 snack, 2 mini desserts, 1 cake, seasonal fruit.',
        imageUrl: '/images/events/coffee-vip.jpg',
        location: 'São Paulo, SP',
        eventType: 'buffet',
        menuOptions: 1,
        status: 'active'
      },
      {
        title: 'Coffee Break Premium',
        titleEn: 'Premium Coffee Break',
        description: 'Coffee break premium com água aromatizada, café, leite, chás, chocolate, iogurte, 2 sucos, 2 snacks, 2 mini-sanduíches, 2 mini-doces, 2 bolos, frutas da estação.',
        descriptionEn: 'Premium coffee break with flavored water, coffee, milk, teas, chocolate, yogurt, 2 juices, 2 snacks, 2 mini-sandwiches, 2 mini-desserts, 2 cakes, seasonal fruits.',
        imageUrl: '/images/events/coffee-premium.jpg',
        location: 'São Paulo, SP',
        eventType: 'buffet',
        menuOptions: 1,
        status: 'active'
      },
      {
        title: 'Coquetel Volante Básico',
        titleEn: 'Basic Cocktail Service',
        description: 'Coquetel volante básico com 2 canapés frios, 2 canapés quentes, 1 prato volante, 1 sobremesa.',
        descriptionEn: 'Basic cocktail service with 2 cold canapés, 2 hot canapés, 1 passed dish, 1 dessert.',
        imageUrl: '/images/events/cocktail-basic.jpg',
        location: 'São Paulo, SP',
        eventType: 'cocktail',
        menuOptions: 1,
        status: 'active'
      },
      {
        title: 'Coquetel Volante Standard',
        titleEn: 'Standard Cocktail Service',
        description: 'Coquetel volante standard com 2 canapés frios, 3 canapés quentes, 2 pratos volantes, 1 sobremesa.',
        descriptionEn: 'Standard cocktail service with 2 cold canapés, 3 hot canapés, 2 passed dishes, 1 dessert.',
        imageUrl: '/images/events/cocktail-standard.jpg',
        location: 'São Paulo, SP',
        eventType: 'cocktail',
        menuOptions: 1,
        status: 'active'
      },
      {
        title: 'Coquetel Volante VIP',
        titleEn: 'VIP Cocktail Service',
        description: 'Coquetel volante VIP com 4 canapés frios, 4 canapés quentes, pratos volantes (1 massa + 1 risoto + 1 prato com proteína), 2 sobremesas.',
        descriptionEn: 'VIP cocktail service with 4 cold canapés, 4 hot canapés, passed dishes (1 pasta + 1 risotto + 1 protein dish), 2 desserts.',
        imageUrl: '/images/events/cocktail-vip.jpg',
        location: 'São Paulo, SP',
        eventType: 'cocktail',
        menuOptions: 1,
        status: 'active'
      },
      {
        title: 'Ilha Gastronômica Standard',
        titleEn: 'Standard Gastronomic Island',
        description: 'Ilha gastronômica standard com 2 pratos frios, 1 prato quente, seleção de queijos & charcuterie do chef, seleção de pães, 2 antepastos.',
        descriptionEn: 'Standard gastronomic island with 2 cold dishes, 1 hot dish, chef\'s cheese & charcuterie selection, bread selection, 2 appetizers.',
        imageUrl: '/images/events/island-standard.jpg',
        location: 'São Paulo, SP',
        eventType: 'buffet',
        menuOptions: 1,
        status: 'active'
      },
      {
        title: 'Ilha Gastronômica VIP',
        titleEn: 'VIP Gastronomic Island',
        description: 'Ilha gastronômica VIP com 2 pratos frios, 1 terrine, 1 brie quente, 1 prato quente, queijos, charcuterie, castanhas, seleção de pães, antepastos.',
        descriptionEn: 'VIP gastronomic island with 2 cold dishes, 1 terrine, 1 hot brie, 1 hot dish, cheeses, charcuterie, nuts, bread selection, appetizers.',
        imageUrl: '/images/events/island-vip.jpg',
        location: 'São Paulo, SP',
        eventType: 'buffet',
        menuOptions: 1,
        status: 'active'
      },
      {
        title: 'Lunch Box - Microsoft',
        titleEn: 'Lunch Box - Microsoft',
        description: 'Lunch box com bowl de salada, bowl quentinho, sobremesa go mama. Kit montado em sacola kraft com talheres biodegradáveis.',
        descriptionEn: 'Lunch box with salad bowl, hot bowl, go mama dessert. Kit assembled in kraft bag with biodegradable utensils.',
        imageUrl: '/images/events/lunch-box.jpg',
        location: 'São Paulo, SP',
        eventType: 'box',
        menuOptions: 1,
        status: 'active'
      },
      {
        title: 'Almoço Buffet Lounge - Microsoft',
        titleEn: 'Lunch Buffet Lounge - Microsoft',
        description: 'Almoço buffet lounge mais informal, dispensa uso de faca. Pratos montados em réchauds com salada, prato principal e acompanhamentos.',
        descriptionEn: 'More informal lunch buffet lounge, no knife required. Dishes assembled in réchauds with salad, main dish and sides.',
        imageUrl: '/images/events/lunch-lounge.jpg',
        location: 'São Paulo, SP',
        eventType: 'buffet',
        menuOptions: 1,
        status: 'active'
      }
    ];

    console.log('Inserindo eventos...');
    const insertedEvents = [];
    
    for (const event of eventData) {
      const [insertedEvent] = await db.insert(schema.events).values(event).returning();
      insertedEvents.push(insertedEvent);
      console.log(`Evento inserido: ${insertedEvent.title}`);
    }

    // Agora vamos inserir os menus correspondentes
    console.log('Inserindo menus...');
    
    const menuData = [
      {
        name: 'Almoço Standard',
        nameEn: 'Standard Lunch',
        description: '1 Salada + 1 Prato Principal + 2 Acompanhamentos + 1 Fruta OU 1 Sobremesa + 1 Suco + Refri + Água',
        descriptionEn: '1 Salad + 1 Main Dish + 2 Sides + 1 Fruit OR 1 Dessert + 1 Juice + Soft Drinks + Water',
        price: 149.00,
        imageUrl: '/images/menus/lunch-standard.jpg'
      },
      {
        name: 'Almoço VIP',
        nameEn: 'VIP Lunch',
        description: '1 Salada + 1 Prato Principal + 2 Acompanhamentos + 1 Sobremesa + Frutas da Estação + 1 Suco + Refri + Água',
        descriptionEn: '1 Salad + 1 Main Dish + 2 Sides + 1 Dessert + Seasonal Fruits + 1 Juice + Soft Drinks + Water',
        price: 209.00,
        imageUrl: '/images/menus/lunch-vip.jpg'
      },
      {
        name: 'Almoço Premium',
        nameEn: 'Premium Lunch',
        description: '2 Saladas + 2 Pratos Principais (Premium) + 1 Massa + 1 Acompanhamento Premium + 2 Sobremesas + Frutas da Estação + 1 Suco + Refri + Água',
        descriptionEn: '2 Salads + 2 Premium Main Dishes + 1 Pasta + 1 Premium Side + 2 Desserts + Seasonal Fruits + 1 Juice + Soft Drinks + Water',
        price: 249.00,
        imageUrl: '/images/menus/lunch-premium.jpg'
      },
      {
        name: 'Almoço Empratado',
        nameEn: 'Plated Lunch',
        description: '1 Entrada Fria + 1 Prato Principal + 1 Sobremesa. Menu único para todos os convidados.',
        descriptionEn: '1 Cold Starter + 1 Main Dish + 1 Dessert. Single menu for all guests.',
        price: 189.00,
        imageUrl: '/images/menus/lunch-plated.jpg'
      },
      {
        name: 'Brunch',
        nameEn: 'Brunch',
        description: '2 Snacks + 2 Saladas + 1 Torta + 1 Quiche + 1 Massa + 2 Sobremesas + Frutas da Estação',
        descriptionEn: '2 Snacks + 2 Salads + 1 Pie + 1 Quiche + 1 Pasta + 2 Desserts + Seasonal Fruits',
        price: 169.00,
        imageUrl: '/images/menus/brunch.jpg'
      },
      {
        name: 'Café da Manhã Standard',
        nameEn: 'Standard Breakfast',
        description: 'Água + Café + Leite + Chás + Chocolate + 1 Suco + 2 Mini-Sanduíches + 1 Bolo + Frutas da Estação',
        descriptionEn: 'Water + Coffee + Milk + Teas + Chocolate + 1 Juice + 2 Mini-Sandwiches + 1 Cake + Seasonal Fruits',
        price: 89.00,
        imageUrl: '/images/menus/breakfast-standard.jpg'
      },
      {
        name: 'Café da Manhã Premium',
        nameEn: 'Premium Breakfast',
        description: 'Água Aromatizada + Café + Leite + Chás + Chocolate + Iogurte + 2 Sucos + 2 Mini-Sanduíches + 3 Snacks + 1 Mini Doce + 1 Bolo + Frutas da Estação',
        descriptionEn: 'Flavored Water + Coffee + Milk + Teas + Chocolate + Yogurt + 2 Juices + 2 Mini-Sandwiches + 3 Snacks + 1 Mini Dessert + 1 Cake + Seasonal Fruits',
        price: 129.00,
        imageUrl: '/images/menus/breakfast-premium.jpg'
      },
      {
        name: 'Coffee Break Básico',
        nameEn: 'Basic Coffee Break',
        description: 'Água + Café + Chás Variados + Petit Fours ou Pão de Queijo Tradicional',
        descriptionEn: 'Water + Coffee + Various Teas + Petit Fours or Traditional Cheese Bread',
        price: 49.00,
        imageUrl: '/images/menus/coffee-basic.jpg'
      },
      {
        name: 'Coffee Break Standard',
        nameEn: 'Standard Coffee Break',
        description: 'Água + Café + Leite + Chás + 1 Suco + 1 Mini-Sanduíche + 1 Snack + 1 Bolo + Frutas da Estação',
        descriptionEn: 'Water + Coffee + Milk + Teas + 1 Juice + 1 Mini-Sandwich + 1 Snack + 1 Cake + Seasonal Fruits',
        price: 69.00,
        imageUrl: '/images/menus/coffee-standard.jpg'
      },
      {
        name: 'Coffee Break VIP',
        nameEn: 'VIP Coffee Break',
        description: 'Água + Café + Leite + Chás + Chocolate + 2 Sucos + 1 Mini Sanduíche + 1 Snack + 2 Mini Doces + 1 Bolo + Fruta da Estação',
        descriptionEn: 'Water + Coffee + Milk + Teas + Chocolate + 2 Juices + 1 Mini Sandwich + 1 Snack + 2 Mini Desserts + 1 Cake + Seasonal Fruit',
        price: 89.00,
        imageUrl: '/images/menus/coffee-vip.jpg'
      },
      {
        name: 'Coffee Break Premium',
        nameEn: 'Premium Coffee Break',
        description: 'Água Aromatizada + Café + Leite + Chás + Chocolate + Iogurte + 2 Sucos + 2 Snacks + 2 Mini-Sanduíches + 2 Mini-Doces + 2 Bolos + Frutas da Estação',
        descriptionEn: 'Flavored Water + Coffee + Milk + Teas + Chocolate + Yogurt + 2 Juices + 2 Snacks + 2 Mini-Sandwiches + 2 Mini-Desserts + 2 Cakes + Seasonal Fruits',
        price: 109.00,
        imageUrl: '/images/menus/coffee-premium.jpg'
      },
      {
        name: 'Coquetel Volante Básico',
        nameEn: 'Basic Cocktail Service',
        description: '2 Canapés Frios + 2 Canapés Quentes + 1 Prato Volante + 1 Sobremesa',
        descriptionEn: '2 Cold Canapés + 2 Hot Canapés + 1 Passed Dish + 1 Dessert',
        price: 79.00,
        imageUrl: '/images/menus/cocktail-basic.jpg'
      },
      {
        name: 'Coquetel Volante Standard',
        nameEn: 'Standard Cocktail Service',
        description: '2 Canapés Frios + 3 Canapés Quentes + 2 Pratos Volantes + 1 Sobremesa',
        descriptionEn: '2 Cold Canapés + 3 Hot Canapés + 2 Passed Dishes + 1 Dessert',
        price: 99.00,
        imageUrl: '/images/menus/cocktail-standard.jpg'
      },
      {
        name: 'Coquetel Volante VIP',
        nameEn: 'VIP Cocktail Service',
        description: '4 Canapés Frios + 4 Canapés Quentes + Pratos Volantes (1 Massa + 1 Risoto + 1 Prato com Proteína) + 2 Sobremesas',
        descriptionEn: '4 Cold Canapés + 4 Hot Canapés + Passed Dishes (1 Pasta + 1 Risotto + 1 Protein Dish) + 2 Desserts',
        price: 149.00,
        imageUrl: '/images/menus/cocktail-vip.jpg'
      },
      {
        name: 'Ilha Gastronômica Standard',
        nameEn: 'Standard Gastronomic Island',
        description: '2 Pratos Frios + 1 Prato Quente + Seleção de Queijos & Charcuterie + Seleção de Pães + 2 Antepastos',
        descriptionEn: '2 Cold Dishes + 1 Hot Dish + Cheese & Charcuterie Selection + Bread Selection + 2 Appetizers',
        price: 119.00,
        imageUrl: '/images/menus/island-standard.jpg'
      },
      {
        name: 'Ilha Gastronômica VIP',
        nameEn: 'VIP Gastronomic Island',
        description: '2 Pratos Frios + 1 Terrine + 1 Brie Quente + 1 Prato Quente + Queijos + Charcuterie + Castanhas + Seleção de Pães + Antepastos',
        descriptionEn: '2 Cold Dishes + 1 Terrine + 1 Hot Brie + 1 Hot Dish + Cheeses + Charcuterie + Nuts + Bread Selection + Appetizers',
        price: 169.00,
        imageUrl: '/images/menus/island-vip.jpg'
      },
      {
        name: 'Lunch Box - Microsoft',
        nameEn: 'Lunch Box - Microsoft',
        description: 'Bowl de Salada + Bowl Quentinho + Sobremesa Go Mama. Kit montado em sacola kraft com talheres biodegradáveis.',
        descriptionEn: 'Salad Bowl + Hot Bowl + Go Mama Dessert. Kit assembled in kraft bag with biodegradable utensils.',
        price: 89.00,
        imageUrl: '/images/menus/lunch-box.jpg'
      },
      {
        name: 'Almoço Buffet Lounge - Microsoft',
        nameEn: 'Lunch Buffet Lounge - Microsoft',
        description: 'Salada + Prato Principal + 2 Acompanhamentos + Sobremesa Montada em Louça de Vidro',
        descriptionEn: 'Salad + Main Dish + 2 Sides + Dessert Served in Glass Dish',
        price: 139.00,
        imageUrl: '/images/menus/lunch-lounge.jpg'
      }
    ];

    const insertedMenus = [];
    
    for (const menu of menuData) {
      const [insertedMenu] = await db.insert(schema.menus).values(menu).returning();
      insertedMenus.push(insertedMenu);
      console.log(`Menu inserido: ${insertedMenu.name}`);
    }

    // Agora vamos associar os menus aos eventos
    console.log('Associando menus aos eventos...');
    
    for (let i = 0; i < insertedEvents.length && i < insertedMenus.length; i++) {
      await db.insert(schema.eventMenus).values({
        eventId: insertedEvents[i].id,
        menuId: insertedMenus[i].id
      }).onConflictDoNothing();
      console.log(`Associado: ${insertedEvents[i].title} -> ${insertedMenus[i].name}`);
    }

    console.log('Inserção concluída com sucesso!');
    console.log(`Total de eventos inseridos: ${insertedEvents.length}`);
    console.log(`Total de menus inseridos: ${insertedMenus.length}`);

  } catch (error) {
    console.error('Erro durante a inserção:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar o script
if (require.main === module) {
  insertMicrosoftEvents()
    .then(() => {
      console.log('Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro ao executar script:', error);
      process.exit(1);
    });
}

module.exports = { insertMicrosoftEvents }; 