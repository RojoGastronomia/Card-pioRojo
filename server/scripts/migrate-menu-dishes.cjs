const { db } = require('../db');
const { menus, dishes, menuDishes } = require('../schema');
const { eq } = require('drizzle-orm');

(async () => {
  try {
    console.log('[MIGRATION] Iniciando migração de todos os pratos do modelo legado para a tabela de junção menuDishes...');
    const allMenus = await db.select().from(menus);
    let totalMigrated = 0;
    for (const menu of allMenus) {
      const legacyDishes = await db.select().from(dishes).where(eq(dishes.menuId, menu.id));
      for (const dish of legacyDishes) {
        await db.insert(menuDishes)
          .values({ menuId: menu.id, dishId: dish.id })
          .onConflictDoNothing();
        totalMigrated++;
        console.log(`[MIGRATION] Migrated dish ${dish.id} to menuDishes for menu ${menu.id}`);
      }
    }
    console.log(`[MIGRATION] Migração concluída. Total de vínculos migrados: ${totalMigrated}`);
    process.exit(0);
  } catch (error) {
    console.error('Erro ao migrar pratos para menuDishes:', error);
    process.exit(1);
  }
})(); 