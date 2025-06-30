import { db } from './db';
import { dishes, menuDishes } from '../shared/schema';

async function seedDishes() {
  try {
    console.log('Iniciando inserção de pratos...');

    const dishesToInsert = [
      // Coffee Break Básico
      {
        name: 'Café Expresso',
        description: 'Café expresso tradicional',
        price: 0,
        category: 'BEBIDAS',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd'
      },
      {
        name: 'Café com Leite',
        description: 'Café com leite quente',
        price: 0,
        category: 'BEBIDAS',
        imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d'
      },
      {
        name: 'Chá Verde',
        description: 'Chá verde tradicional',
        price: 0,
        category: 'BEBIDAS',
        imageUrl: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5'
      },
      {
        name: 'Chá de Camomila',
        description: 'Chá de camomila relaxante',
        price: 0,
        category: 'BEBIDAS',
        imageUrl: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5'
      },
      {
        name: 'Água Mineral',
        description: 'Água mineral sem gás',
        price: 0,
        category: 'BEBIDAS',
        imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d'
      },
      {
        name: 'Suco de Laranja',
        description: 'Suco de laranja natural',
        price: 0,
        category: 'BEBIDAS',
        imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba'
      },
      {
        name: 'Suco de Maracujá',
        description: 'Suco de maracujá natural',
        price: 0,
        category: 'BEBIDAS',
        imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba'
      },
      {
        name: 'Biscoitos',
        description: 'Mix de biscoitos',
        price: 0,
        category: 'DOCES',
        imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35'
      },
      {
        name: 'Cookies',
        description: 'Cookies de chocolate',
        price: 0,
        category: 'DOCES',
        imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e'
      },
      {
        name: 'Frutas da Estação',
        description: 'Mix de frutas da estação',
        price: 0,
        category: 'FRUTAS',
        imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf'
      },

      // Coffee Break Premium (itens adicionais)
      {
        name: 'Pão de Queijo',
        description: 'Pão de queijo quentinho',
        price: 0,
        category: 'SALGADOS',
        imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c'
      },
      {
        name: 'Coxinha',
        description: 'Coxinha de frango',
        price: 0,
        category: 'SALGADOS',
        imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cddf3edb2c7'
      },
      {
        name: 'Quibe',
        description: 'Quibe assado',
        price: 0,
        category: 'SALGADOS',
        imageUrl: 'https://images.unsplash.com/photo-1625944525903-b6d02ae7b8a9'
      },
      {
        name: 'Risoles',
        description: 'Risoles de presunto e queijo',
        price: 0,
        category: 'SALGADOS',
        imageUrl: 'https://images.unsplash.com/photo-1625944525903-b6d02ae7b8a9'
      },
      {
        name: 'Empadinha',
        description: 'Empadinha de frango',
        price: 0,
        category: 'SALGADOS',
        imageUrl: 'https://images.unsplash.com/photo-1625944525903-b6d02ae7b8a9'
      },
      {
        name: 'Café Especial',
        description: 'Café especial da casa',
        price: 0,
        category: 'BEBIDAS',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd'
      },
      {
        name: 'Cappuccino',
        description: 'Cappuccino cremoso',
        price: 0,
        category: 'BEBIDAS',
        imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d'
      },

      // Almoço Corporativo Básico
      {
        name: 'Arroz Branco',
        description: 'Arroz branco soltinho',
        price: 0,
        category: 'ACOMPANHAMENTOS',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c'
      },
      {
        name: 'Feijão Carioca',
        description: 'Feijão carioca',
        price: 0,
        category: 'ACOMPANHAMENTOS',
        imageUrl: 'https://images.unsplash.com/photo-1594283255768-9e4c9aa7400a'
      },
      {
        name: 'Farofa',
        description: 'Farofa de manteiga',
        price: 0,
        category: 'ACOMPANHAMENTOS',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c'
      },
      {
        name: 'Salada Mista',
        description: 'Mix de folhas, tomate e cenoura',
        price: 0,
        category: 'SALADAS',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd'
      },
      {
        name: 'Salada de Grãos',
        description: 'Mix de grãos com legumes',
        price: 0,
        category: 'SALADAS',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd'
      },
      {
        name: 'Frango Grelhado',
        description: 'Filé de frango grelhado',
        price: 0,
        category: 'PROTEÍNAS',
        imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b'
      },
      {
        name: 'Carne Assada',
        description: 'Carne assada ao ponto',
        price: 0,
        category: 'PROTEÍNAS',
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947'
      },
      {
        name: 'Pudim',
        description: 'Pudim de leite condensado',
        price: 0,
        category: 'SOBREMESAS',
        imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51'
      },
      {
        name: 'Gelatina',
        description: 'Gelatina colorida',
        price: 0,
        category: 'SOBREMESAS',
        imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51'
      },

      // Almoço Corporativo Premium (itens adicionais)
      {
        name: 'Arroz Integral',
        description: 'Arroz integral',
        price: 0,
        category: 'ACOMPANHAMENTOS',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c'
      },
      {
        name: 'Arroz com Brócolis',
        description: 'Arroz com brócolis',
        price: 0,
        category: 'ACOMPANHAMENTOS',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c'
      },
      {
        name: 'Peixe Grelhado',
        description: 'Filé de peixe grelhado',
        price: 0,
        category: 'PROTEÍNAS',
        imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288'
      },
      {
        name: 'Frango ao Molho',
        description: 'Frango ao molho de ervas',
        price: 0,
        category: 'PROTEÍNAS',
        imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b'
      },
      {
        name: 'Legumes Grelhados',
        description: 'Mix de legumes grelhados',
        price: 0,
        category: 'ACOMPANHAMENTOS',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
      },
      {
        name: 'Salada Premium',
        description: 'Salada com mix de folhas, grãos e frutas',
        price: 0,
        category: 'SALADAS',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd'
      },
      {
        name: 'Mousse de Chocolate',
        description: 'Mousse de chocolate',
        price: 0,
        category: 'SOBREMESAS',
        imageUrl: 'https://images.unsplash.com/photo-1576866209830-589e1bfbaa4d'
      },
      {
        name: 'Torta de Limão',
        description: 'Torta de limão',
        price: 0,
        category: 'SOBREMESAS',
        imageUrl: 'https://images.unsplash.com/photo-1576866209830-589e1bfbaa4d'
      }
    ];

    // Inserir pratos
    for (const dish of dishesToInsert) {
      const [insertedDish] = await db.insert(dishes).values(dish).returning();
      console.log(`Prato "${dish.name}" inserido com sucesso!`);

      // Vincular prato aos menus apropriados
      if (dish.category === 'BEBIDAS' || dish.category === 'DOCES' || dish.category === 'FRUTAS') {
        // Vincular ao Coffee Break Básico (menu_id: 1)
        await db.insert(menuDishes).values({ menuId: 1, dishId: insertedDish.id });
      }

      if (dish.category === 'SALGADOS' || 
          (dish.category === 'BEBIDAS' && (dish.name.includes('Especial') || dish.name.includes('Cappuccino')))) {
        // Vincular ao Coffee Break Premium (menu_id: 2)
        await db.insert(menuDishes).values({ menuId: 2, dishId: insertedDish.id });
      }

      if (dish.category === 'ACOMPANHAMENTOS' || dish.category === 'SALADAS' || 
          dish.category === 'PROTEÍNAS' || dish.category === 'SOBREMESAS') {
        // Vincular ao Almoço Corporativo Básico (menu_id: 4)
        await db.insert(menuDishes).values({ menuId: 4, dishId: insertedDish.id });
      }

      if (dish.name.includes('Integral') || dish.name.includes('Peixe') || 
          dish.name.includes('Legumes') || dish.name.includes('Premium') ||
          dish.name.includes('Mousse') || dish.name.includes('Torta')) {
        // Vincular ao Almoço Corporativo Premium (menu_id: 5)
        await db.insert(menuDishes).values({ menuId: 5, dishId: insertedDish.id });
      }
    }

    console.log('Inserção de pratos e vinculação com menus concluída!');
  } catch (error) {
    console.error('Erro ao inserir pratos:', error);
  }
}

seedDishes(); 