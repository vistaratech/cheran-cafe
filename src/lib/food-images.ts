export const FOOD_IMAGE_MAP: Record<string, string> = {
  // Snacks
  'Veg Puffs': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80',
  'Egg Puffs': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80',
  'Paneer Puffs': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80',
  'Chicken Puffs': 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=500&auto=format&fit=crop&q=80',
  'Mushroom Puffs': 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=500&auto=format&fit=crop&q=80',
  'Veg Roll': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  'Egg Roll': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  'Chicken Roll': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',

  // Hot Beverages
  'Tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80',
  'Lemon Tea': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=80',
  'Coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
  'Green Tea': 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=500&auto=format&fit=crop&q=80',
  'Badam': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80',
  'Boost': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80',
  'Horlicks': 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&auto=format&fit=crop&q=80',

  // Falooda & Desserts
  'Normal Falooda': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
  'Mango Falooda': 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=500&auto=format&fit=crop&q=80',
  'Dry Fruit Falooda': 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=500&auto=format&fit=crop&q=80',
  'Rose Falooda': 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&auto=format&fit=crop&q=80',
  'Rose Malai Falooda': 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&auto=format&fit=crop&q=80',
  'Special Cheran Falooda': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=80',
  'Special Falooda': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=80',
  'Avil Milk': 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=500&auto=format&fit=crop&q=80',
  'SP Avil Milk': 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=500&auto=format&fit=crop&q=80',

  // Cheran Special
  'Cocktail Shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80',
  'Royal Falooda': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=80',
  'Fruit Salad with Ice Cream': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=80',
  'Sizzling Brownie': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80',
  'Choco Lava Cake': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80',
  'KitKat Milkshake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80',
};

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'Snacks': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80',
  'Hot': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80',
  'Falooda': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
  'Cheran Special': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80',
};

export function getFoodImageUrl(name: string, category?: string, currentImageUrl?: string): string {
  // Always check direct item name match first for known items
  if (FOOD_IMAGE_MAP[name]) {
    return FOOD_IMAGE_MAP[name];
  }

  // If currentImageUrl exists and is a valid external image URL, use it
  if (
    currentImageUrl &&
    currentImageUrl.trim() !== '' &&
    currentImageUrl !== '/placeholder-menu-item.jpg' &&
    !currentImageUrl.startsWith('https://placehold.co')
  ) {
    return currentImageUrl;
  }

  // Case insensitive fuzzy match
  const lowerName = name.toLowerCase();
  for (const [key, url] of Object.entries(FOOD_IMAGE_MAP)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return url;
    }
  }

  if (lowerName.includes('puff')) return FOOD_IMAGE_MAP['Veg Puffs'];
  if (lowerName.includes('roll')) return FOOD_IMAGE_MAP['Egg Roll'];
  if (lowerName.includes('tea')) return FOOD_IMAGE_MAP['Tea'];
  if (lowerName.includes('falooda')) return FOOD_IMAGE_MAP['Normal Falooda'];
  if (lowerName.includes('shake') || lowerName.includes('milk')) return FOOD_IMAGE_MAP['Avil Milk'];
  if (lowerName.includes('cake') || lowerName.includes('brownie')) return FOOD_IMAGE_MAP['Sizzling Brownie'];

  // Check category fallback
  if (category && CATEGORY_FALLBACK_IMAGES[category]) {
    return CATEGORY_FALLBACK_IMAGES[category];
  }

  // General fallback
  return 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80';
}
