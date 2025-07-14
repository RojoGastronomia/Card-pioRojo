import { migrateAllLegacyMenuDishes } from '../storage';

(async () => {
  try {
    await migrateAllLegacyMenuDishes();
    console.log('Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao migrar pratos para menuDishes:', error);
    process.exit(1);
  }
})(); 