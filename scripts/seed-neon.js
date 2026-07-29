import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_CNPXR8GaJ4BE@ep-super-queen-az4z8z0e-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(connectionString);

async function main() {
  console.log('🚀 Connecting to Neon PostgreSQL...');
  
  // 1. Create users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      restaurant_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log('✅ Created table: users');

  // 2. Create categories table
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      depth INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log('✅ Created table: categories');

  // 3. Create menu_items table
  await sql`
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price NUMERIC(10, 2) NOT NULL,
      category TEXT NOT NULL,
      available BOOLEAN DEFAULT TRUE,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log('✅ Created table: menu_items');

  // 4. Create orders table
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      table_number INT,
      status TEXT NOT NULL DEFAULT 'pending',
      total NUMERIC(10, 2) NOT NULL,
      subtotal NUMERIC(10, 2),
      tax NUMERIC(10, 2),
      items JSONB NOT NULL,
      order_type TEXT DEFAULT 'dine-in',
      customer_info JSONB,
      payment_status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log('✅ Created table: orders');

  // 5. Create restaurants table
  await sql`
    CREATE TABLE IF NOT EXISTS restaurants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      logo_url TEXT,
      currency TEXT DEFAULT '₹',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log('✅ Created table: restaurants');

  // 6. Create inventory table
  await sql`
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      quantity NUMERIC(10, 2) NOT NULL,
      unit TEXT NOT NULL,
      reorder_threshold NUMERIC(10, 2),
      category TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log('✅ Created table: inventory');

  // 7. Create payments table
  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT,
      payphone_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  console.log('✅ Created table: payments');

  // Insert default admin user
  await sql`
    INSERT INTO users (id, name, email, password, role)
    VALUES ('admin-1', 'Admin', 'admin@cherancafe.com', '1234', 'Owner')
    ON CONFLICT (email) DO NOTHING;
  `;
  console.log('👤 Seeded admin user (admin@cherancafe.com / 1234)');

  console.log('\n🎉 ALL TABLES CREATED & SEEDED IN NEON POSTGRESQL SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('❌ Error executing Neon script:', err);
  process.exit(1);
});
