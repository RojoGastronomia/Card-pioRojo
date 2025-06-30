const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { eq } = require('drizzle-orm');
const { dishes, menus, menuDishes } = require('./drizzle/schema');

// Configuração do banco
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sitecard';
const client = postgres(connectionString);
const db = drizzle(client);

async function checkAndFixDishMenuAssociations() {
  console.log('🔍 Verificando associações entre pratos e menus...\n');

  try {
    // 1. Verificar quantos pratos existem no total
    const allDishes = await db.select().from(dishes);
    console.log(`📊 Total de pratos no sistema: ${allDishes.length}`);

    // 2. Verificar quantos pratos têm menuId definido
    const dishesWithMenuId = allDishes.filter(dish => dish.menuId !== null);
    console.log(`📊 Pratos com menuId definido: ${dishesWithMenuId.length}`);

    // 3. Verificar quantos registros existem na tabela de junção
    const junctionRecords = await db.select().from(menuDishes);
    console.log(`📊 Registros na tabela de junção (menuDishes): ${junctionRecords.length}`);

    // 4. Verificar pratos por menuId
    const menuIds = [...new Set(dishesWithMenuId.map(dish => dish.menuId))];
    console.log(`📊 Menu IDs encontrados: ${menuIds.join(', ')}`);

    for (const menuId of menuIds) {
      const dishesForMenu = dishesWithMenuId.filter(dish => dish.menuId === menuId);
      console.log(`📊 Menu ${menuId}: ${dishesForMenu.length} pratos`);
    }

    // 5. Verificar se o menu 1 existe
    const menu1 = await db.select().from(menus).where(eq(menus.id, 1));
    if (menu1.length === 0) {
      console.log('❌ Menu ID 1 não existe!');
      return;
    }
    console.log(`✅ Menu ID 1 existe: "${menu1[0].name}"`);

    // 6. Perguntar se deve limpar as associações incorretas
    console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
    console.log('Muitos pratos estão associados diretamente ao menu 1 na tabela dishes.');
    console.log('Isso faz com que a API retorne todos esses pratos quando consulta o menu 1.');
    console.log('\n💡 SOLUÇÃO:');
    console.log('1. Limpar o campo menuId de todos os pratos');
    console.log('2. Usar apenas a tabela de junção menuDishes para associações');
    console.log('3. Recriar as associações corretas através da interface');

    // 7. Executar a correção
    console.log('\n🔧 Executando correção...');
    
    // Limpar menuId de todos os pratos
    await db.update(dishes).set({ menuId: null });
    console.log('✅ Campo menuId limpo de todos os pratos');

    // Verificar resultado
    const dishesAfterFix = await db.select().from(dishes);
    const dishesWithMenuIdAfter = dishesAfterFix.filter(dish => dish.menuId !== null);
    console.log(`📊 Pratos com menuId após correção: ${dishesWithMenuIdAfter.length}`);

    console.log('\n✅ Correção concluída!');
    console.log('Agora a API /api/menus/1/dishes deve retornar apenas pratos que foram explicitamente vinculados.');
    console.log('Use a interface para vincular os pratos corretos ao menu.');

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  } finally {
    await client.end();
  }
}

// Executar o script
checkAndFixDishMenuAssociations(); 