const { db } = require('./db');
const { menuDishes, dishes, menus } = require('../shared/schema');

async function checkMenuDishes() {
  try {
    console.log('=== VERIFICANDO DADOS DE MENUS E PRATOS ===');
    
    // Verificar menus
    const allMenus = await db.select().from(menus);
    console.log('Total de menus:', allMenus.length);
    allMenus.forEach(menu => console.log(`Menu ${menu.id}: ${menu.name}`));
    
    // Verificar pratos
    const allDishes = await db.select().from(dishes);
    console.log('Total de pratos:', allDishes.length);
    
    // Verificar associações
    const menuDishesData = await db.select().from(menuDishes);
    console.log('Total de associações menu-prato:', menuDishesData.length);
    
    if (menuDishesData.length > 0) {
      menuDishesData.forEach(assoc => console.log(`Menu ${assoc.menuId} -> Prato ${assoc.dishId}`));
    } else {
      console.log('NENHUMA associação encontrada na tabela menu_dishes!');
    }
    
    // Verificar pratos com menuId direto
    const dishesWithMenuId = allDishes.filter(dish => dish.menuId !== null);
    console.log('Pratos com menuId direto:', dishesWithMenuId.length);
    dishesWithMenuId.forEach(dish => console.log(`Prato ${dish.id}: ${dish.name} -> Menu ${dish.menuId}`));
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    process.exit(0);
  }
}

checkMenuDishes(); 