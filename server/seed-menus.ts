import { db } from './db';
import { menus, eventMenus } from '../shared/schema';

async function seedMenus() {
  try {
    console.log('Iniciando inserção de menus...');

    const menusToInsert = [
      {
        name: 'Coffee Break Básico',
        description: 'Café, chá, água, suco, biscoitos e frutas',
        price: 25.00,
        imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952'
      },
      {
        name: 'Coffee Break Premium',
        description: 'Café, chá, água, suco, biscoitos, frutas e salgados',
        price: 35.00,
        imageUrl: 'https://images.unsplash.com/photo-1552581234-26160f608093'
      },
      {
        name: 'Café da Manhã Básico',
        description: 'Café, leite, chá, pão, manteiga, queijo, presunto e frutas',
        price: 30.00,
        imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666'
      },
      {
        name: 'Almoço Corporativo Básico',
        description: 'Arroz, feijão, salada, proteína e sobremesa',
        price: 45.00,
        imageUrl: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca'
      },
      {
        name: 'Almoço Corporativo Premium',
        description: 'Arroz integral, feijão, salada premium, proteína especial e sobremesa gourmet',
        price: 65.00,
        imageUrl: 'https://images.unsplash.com/photo-1530062845289-9109b2c9c868'
      },
      {
        name: 'Brunch Básico',
        description: 'Café, leite, chá, pão, manteiga, queijo, presunto, frutas e doces',
        price: 40.00,
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349'
      },
      {
        name: 'Coquetel Básico',
        description: 'Água, suco, salgados e doces',
        price: 35.00,
        imageUrl: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88'
      },
      {
        name: 'Coquetel Premium',
        description: 'Água, suco, champagne, salgados especiais e doces finos',
        price: 55.00,
        imageUrl: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88'
      },
      {
        name: 'Jantar de Gala',
        description: 'Entrada, prato principal, sobremesa e bebidas',
        price: 120.00,
        imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0'
      },
      {
        name: 'Lanche da Tarde',
        description: 'Café, chá, bolos, sanduíches e frutas',
        price: 30.00,
        imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87'
      },
      {
        name: 'Coffee Break para Conferências',
        description: 'Café especial, chá, água, suco, biscoitos, frutas e salgados',
        price: 40.00,
        imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952'
      },
      {
        name: 'Coffee Break para Workshops',
        description: 'Café, chá, água, suco, biscoitos, frutas e salgados',
        price: 35.00,
        imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952'
      }
    ];

    // Primeiro, inserir todos os menus
    for (const menu of menusToInsert) {
      const [insertedMenu] = await db.insert(menus).values(menu).returning();
      console.log(`Menu "${menu.name}" inserido com sucesso!`);
    }

    console.log('Inserção de menus concluída!');
  } catch (error) {
    console.error('Erro ao inserir menus:', error);
  }
}

seedMenus(); 