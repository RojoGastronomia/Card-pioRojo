import { db } from './db';
import { categories } from 'shared/schema';
import { eq } from 'drizzle-orm';
import logger from './logger';

async function migrateCategories() {
  try {
    console.log('Iniciando migração de categorias...');

    // Categorias padrão
    const defaultCategories = [
      { name: 'Entrada', nameEn: 'Appetizer' },
      { name: 'Prato Principal', nameEn: 'Main Course' },
      { name: 'Sobremesa', nameEn: 'Dessert' },
      { name: 'Bebidas', nameEn: 'Beverages' },
      { name: 'Executivo', nameEn: 'Executive' },
      { name: 'Premium', nameEn: 'Premium' },
      { name: 'Clássico', nameEn: 'Classic' },
      { name: 'Gourmet', nameEn: 'Gourmet' },
      { name: 'Internacional', nameEn: 'International' },
      { name: 'Festa', nameEn: 'Party' }
    ];

    // Inserir categorias padrão
    for (const category of defaultCategories) {
      const [existingCategory] = await db
        .select()
        .from(categories)
        .where(eq(categories.name, category.name));

      if (!existingCategory) {
        await db.insert(categories).values(category);
        console.log(`Categoria "${category.name}" criada com sucesso!`);
      } else {
        console.log(`Categoria "${category.name}" já existe.`);
      }
    }

    console.log('Migração de categorias concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao migrar categorias:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrateCategories(); 