import { v4 as uuidv4 } from 'uuid';
import CategoryModel from '@/models/Category';
import MenuItemModel from '@/models/MenuItem';
import WorkstationModel from '@/models/Workstation';
import PaymentModel from '@/models/Payment';
import debug from 'debug';

const log = debug('chefcito:seed');

export async function seedRestaurantData(restaurantId: string, force: boolean = false) {
  await seedCategories(restaurantId, force);
  await seedMenuItems(restaurantId, force);
  await seedWorkstations(restaurantId);
  await seedPayments(restaurantId);
}

async function seedCategories(restaurantId: string, force: boolean = false) {
  if (force) {
    await CategoryModel.deleteMany({ restaurantId });
  } else {
    const existing = await CategoryModel.countDocuments({ restaurantId });
    if (existing > 0) {
      log('Categories already exist for %s, skipping', restaurantId);
      return;
    }
  }

  const categories = [
    { id: uuidv4(), restaurantId, name: 'Snacks' },
    { id: uuidv4(), restaurantId, name: 'Hot' },
    { id: uuidv4(), restaurantId, name: 'Falooda' },
    { id: uuidv4(), restaurantId, name: 'Cheran Special' },
  ];

  await CategoryModel.insertMany(categories);
  log('Seeded %d categories for %s', categories.length, restaurantId);
}

async function seedMenuItems(restaurantId: string, force: boolean = false) {
  if (force) {
    await MenuItemModel.deleteMany({ restaurantId });
  } else {
    const existing = await MenuItemModel.countDocuments({ restaurantId });
    if (existing > 0) {
      log('Menu items already exist for %s, skipping', restaurantId);
      return;
    }
  }

  const items = [
    // Snacks
    { id: uuidv4(), restaurantId, name: 'Veg Puffs', price: 20, category: 'Snacks', imageUrl: '', sortIndex: 0, available: true },
    { id: uuidv4(), restaurantId, name: 'Egg Puffs', price: 25, category: 'Snacks', imageUrl: '', sortIndex: 1, available: true },
    { id: uuidv4(), restaurantId, name: 'Paneer Puffs', price: 25, category: 'Snacks', imageUrl: '', sortIndex: 2, available: true },
    { id: uuidv4(), restaurantId, name: 'Chicken Puffs', price: 30, category: 'Snacks', imageUrl: '', sortIndex: 3, available: true },
    { id: uuidv4(), restaurantId, name: 'Mushroom Puffs', price: 25, category: 'Snacks', imageUrl: '', sortIndex: 4, available: true },
    { id: uuidv4(), restaurantId, name: 'Veg Roll', price: 30, category: 'Snacks', imageUrl: '', sortIndex: 5, available: true },
    { id: uuidv4(), restaurantId, name: 'Egg Roll', price: 35, category: 'Snacks', imageUrl: '', sortIndex: 6, available: true },
    { id: uuidv4(), restaurantId, name: 'Chicken Roll', price: 40, category: 'Snacks', imageUrl: '', sortIndex: 7, available: true },

    // Hot Beverages
    { id: uuidv4(), restaurantId, name: 'Tea', price: 20, category: 'Hot', imageUrl: '', sortIndex: 0, available: true },
    { id: uuidv4(), restaurantId, name: 'Lemon Tea', price: 20, category: 'Hot', imageUrl: '', sortIndex: 1, available: true },
    { id: uuidv4(), restaurantId, name: 'Coffee', price: 25, category: 'Hot', imageUrl: '', sortIndex: 2, available: true },
    { id: uuidv4(), restaurantId, name: 'Green Tea', price: 20, category: 'Hot', imageUrl: '', sortIndex: 3, available: true },
    { id: uuidv4(), restaurantId, name: 'Badam', price: 25, category: 'Hot', imageUrl: '', sortIndex: 4, available: true },
    { id: uuidv4(), restaurantId, name: 'Boost', price: 30, category: 'Hot', imageUrl: '', sortIndex: 5, available: true },
    { id: uuidv4(), restaurantId, name: 'Horlicks', price: 30, category: 'Hot', imageUrl: '', sortIndex: 6, available: true },

    // Falooda
    { id: uuidv4(), restaurantId, name: 'Normal Falooda', price: 119, category: 'Falooda', imageUrl: '', sortIndex: 0, available: true },
    { id: uuidv4(), restaurantId, name: 'Mango Falooda', price: 119, category: 'Falooda', imageUrl: '', sortIndex: 1, available: true },
    { id: uuidv4(), restaurantId, name: 'Dry Fruit Falooda', price: 139, category: 'Falooda', imageUrl: '', sortIndex: 2, available: true },
    { id: uuidv4(), restaurantId, name: 'Rose Malai Falooda', price: 129, category: 'Falooda', imageUrl: '', sortIndex: 3, available: true },
    { id: uuidv4(), restaurantId, name: 'Special Falooda', price: 169, category: 'Falooda', imageUrl: '', sortIndex: 4, available: true },
    { id: uuidv4(), restaurantId, name: 'Avil Milk', price: 90, category: 'Falooda', imageUrl: '', sortIndex: 5, available: true },
    { id: uuidv4(), restaurantId, name: 'SP Avil Milk', price: 110, category: 'Falooda', imageUrl: '', sortIndex: 6, available: true },

    // Cheran Special
    { id: uuidv4(), restaurantId, name: 'Sizzling Brownie', price: 159, category: 'Cheran Special', imageUrl: '', sortIndex: 0, available: true },
    { id: uuidv4(), restaurantId, name: 'Cocktail Shake', price: 149, category: 'Cheran Special', imageUrl: '', sortIndex: 1, available: true },
  ];

  await MenuItemModel.insertMany(items);
  log('Seeded %d menu items for %s', items.length, restaurantId);
}

async function seedWorkstations(restaurantId: string) {
  const existing = await WorkstationModel.countDocuments({ restaurantId });
  if (existing > 0) {
    log('Workstations already exist for %s, skipping', restaurantId);
    return;
  }

  const workstations = [
    { id: uuidv4(), restaurantId, name: 'Kitchen', states: { new: 'new', inProgress: 'in progress', ready: 'ready' }, position: 0 },
    { id: uuidv4(), restaurantId, name: 'Bar', states: { new: 'new', inProgress: 'in progress', ready: 'ready' }, position: 1 },
    { id: uuidv4(), restaurantId, name: 'Ready', states: { new: 'new', inProgress: 'in progress', ready: 'ready' }, position: 2 },
  ];

  await WorkstationModel.insertMany(workstations);
  log('Seeded %d workstations for %s', workstations.length, restaurantId);
}

async function seedPayments(restaurantId: string) {
  const existing = await PaymentModel.countDocuments({ restaurantId });
  if (existing > 0) {
    log('Payments already exist for %s, skipping', restaurantId);
    return;
  }

  const payments = [
    { id: uuidv4(), restaurantId, name: 'Cash', type: 'cash' as const, enabled: true },
    { id: uuidv4(), restaurantId, name: 'Card', type: 'card' as const, enabled: true },
  ];

  await PaymentModel.insertMany(payments);
  log('Seeded %d payment methods for %s', payments.length, restaurantId);
}
