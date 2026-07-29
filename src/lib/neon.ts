import { neon, neonConfig } from '@neondatabase/serverless';

// Enable caching / connection pooling
neonConfig.fetchConnectionCache = true;

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://neondb_owner:npg_CNPXR8GaJ4BE@ep-super-queen-az4z8z0e-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

// Export Neon sql query executor
export const sql = neon(connectionString);

/**
 * Helper to initialize Cheran Cafe tables in Neon PostgreSQL database if they don't exist yet.
 */
export async function initNeonTables() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS menu_items (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        available BOOLEAN DEFAULT TRUE,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        table_number INT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        total NUMERIC(10, 2) NOT NULL,
        items JSONB NOT NULL,
        order_type VARCHAR(50) DEFAULT 'dine-in',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('[Neon Postgres] Database tables initialized successfully.');
    return true;
  } catch (error) {
    console.error('[Neon Postgres] Error initializing tables:', error);
    return false;
  }
}
