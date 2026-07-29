import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_CNPXR8GaJ4BE@ep-super-queen-az4z8z0e-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(connectionString);

const items = [
  // Snacks
  { id: '1', name: 'Egg Puffs', price: 25.00, category: 'Snacks' },
  { id: '2', name: 'Paneer Puffs', price: 25.00, category: 'Snacks' },
  { id: '3', name: 'Chicken Puffs', price: 30.00, category: 'Snacks' },
  { id: '4', name: 'Mushroom Puffs', price: 25.00, category: 'Snacks' },
  { id: '5', name: 'Veg Puffs', price: 20.00, category: 'Snacks' },
  { id: '6', name: 'Egg Roll', price: 35.00, category: 'Snacks' },
  { id: '7', name: 'Chicken Roll', price: 40.00, category: 'Snacks' },

  // Hot Beverages
  { id: '8', name: 'Tea', price: 20.00, category: 'Hot' },
  { id: '9', name: 'Lemon Tea', price: 20.00, category: 'Hot' },
  { id: '10', name: 'Green Tea', price: 20.00, category: 'Hot' },
  { id: '11', name: 'Badam', price: 25.00, category: 'Hot' },
  { id: '12', name: 'Boost', price: 30.00, category: 'Hot' },
  { id: '13', name: 'Horlicks', price: 30.00, category: 'Hot' },

  // Falooda
  { id: '14', name: 'Mango Falooda', price: 119.00, category: 'Falooda' },
  { id: '15', name: 'Dry Fruit Falooda', price: 139.00, category: 'Falooda' },
  { id: '16', name: 'Rose Falooda', price: 129.00, category: 'Falooda' },
  { id: '17', name: 'Special Cheran Falooda', price: 169.00, category: 'Falooda' },
  { id: '18', name: 'Avil Milk', price: 90.00, category: 'Falooda' },

  // Cheran Special
  { id: '19', name: 'Cocktail Shake', price: 149.00, category: 'Cheran Special' },
  { id: '20', name: 'Royal Falooda', price: 159.00, category: 'Cheran Special' },
  { id: '21', name: 'Fruit Salad with Ice Cream', price: 99.00, category: 'Cheran Special' },
  { id: '22', name: 'Sizzling Brownie', price: 179.00, category: 'Cheran Special' },
  { id: '23', name: 'Choco Lava Cake', price: 89.00, category: 'Cheran Special' },
  { id: '24', name: 'KitKat Milkshake', price: 119.00, category: 'Cheran Special' },
];

async function main() {
  console.log('📦 Seeding menu items to Neon PostgreSQL...');

  for (const item of items) {
    await sql`
      INSERT INTO menu_items (id, name, price, category, available)
      VALUES (${item.id}, ${item.name}, ${item.price}, ${item.category}, true)
      ON CONFLICT (id) DO UPDATE SET
        name = ${item.name},
        price = ${item.price},
        category = ${item.category};
    `;
  }

  console.log(`✅ Seeded ${items.length} Cheran Cafe menu items successfully into Neon!`);
}

main().catch((err) => {
  console.error('❌ Error seeding items:', err);
  process.exit(1);
});
