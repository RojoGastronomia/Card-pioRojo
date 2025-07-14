import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default {
  schema: './shared/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres',
    ssl: {
      rejectUnauthorized: false
    }
  },
} satisfies Config;
