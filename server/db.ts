import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/node-postgres';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

// Function to run all migrations from the migrations folder in order
export async function runMigrations() {
  const client = await pool.connect();
  try {
    // 1. Ensure the schema_migrations table exists (run its own migration first)
    console.log("Ensuring schema_migrations table exists...");
    const migration000Path = path.join(__dirname, '..', 'migrations', '000_create_schema_migrations_table.sql');
    if (fs.existsSync(migration000Path)) {
      const migration000SQL = fs.readFileSync(migration000Path, 'utf-8');
      await client.query(migration000SQL);
      console.log("Schema migrations table checked/created.");
    } else {
       console.warn("Migration file 000_create_schema_migrations_table.sql not found!");
    }

    // 2. Get already applied migration versions
    const result = await client.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(result.rows.map(row => row.version));
    console.log("Applied migration versions:", Array.from(appliedVersions));

    // 3. Get all migration files from the directory
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const allMigrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && file !== '000_create_schema_migrations_table.sql') // Exclude schema table migration
      .sort(); 

    // 4. Filter out already applied migrations
    const migrationsToApply = allMigrationFiles.filter(file => !appliedVersions.has(file));

    if (migrationsToApply.length === 0) {
      console.log("No new migrations to apply.");
    } else {
      console.log("Starting database migrations...");
      // 5. Apply new migrations and record them
      for (const file of migrationsToApply) {
        console.log(`- Applying migration: ${file}`);
        const migrationPath = path.join(migrationsDir, file);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        await client.query('BEGIN'); // Start transaction
        try {
          await client.query(migrationSQL); // Execute the migration SQL
          await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]); // Record success
          await client.query('COMMIT'); // Commit transaction
          console.log(`  Migration ${file} applied and recorded successfully.`);
        } catch (migrationError) {
          await client.query('ROLLBACK'); // Rollback transaction on error
          console.error(`  Error applying migration ${file}:`, migrationError);
          throw migrationError; // Re-throw to stop further migrations
        }
      }
      console.log("New migrations applied successfully.");
    }

  } catch (error) {
    console.error('Error during migration process:', error);
    throw error; // Re-throw to stop server startup if migrations fail
  } finally {
    client.release();
  }
}

// Handle command line arguments
if (process.argv[2] === 'migrate') {
  console.log('Running migrations...');
  runMigrations()
    .then(() => {
      console.log('Migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}