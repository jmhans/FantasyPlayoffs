import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load .env.local file
config({ path: '.env.local' });

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

export default defineConfig({
  out: './drizzle',
  schema: './app/lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL,
  },
  schemaFilter: ['fantasy_playoffs'], // Only work with fantasy_playoffs schema
  verbose: true,
  strict: true,
});
