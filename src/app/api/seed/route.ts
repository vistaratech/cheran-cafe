import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database-service';
import { seedRestaurantData } from '@/lib/seed-data';

export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId') || 'rest-default';
    const forceParam = searchParams.get('force');
    const force = forceParam === null ? true : forceParam === 'true';

    await seedRestaurantData(restaurantId, force);

    return NextResponse.json({
      success: true,
      message: `Seeded menu items and categories for restaurant ${restaurantId}`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
