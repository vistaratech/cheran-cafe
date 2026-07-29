import { NextResponse } from 'next/server';
import Restaurant from '@/models/Restaurant';
import { initializeDatabase } from '@/lib/database-service';

/**
 * GET /api/restaurants/[id]
 * Returns a single restaurant by ID with membership info
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;

    const restaurant = await Restaurant.findOne({ id });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(restaurant.toObject());
  } catch (error) {
    console.error('[Restaurant GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/restaurants/[id]
 * Update restaurant details (name, phone, address, city)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const body = await request.json();

    const restaurant = await Restaurant.findOne({ id });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    if (body.name !== undefined) restaurant.name = body.name;
    if (body.phone !== undefined) restaurant.phone = body.phone;
    if (body.address !== undefined) restaurant.address = body.address;
    if (body.city !== undefined) restaurant.city = body.city;

    await restaurant.save();

    return NextResponse.json(restaurant.toObject());
  } catch (error) {
    console.error('[Restaurant PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update restaurant' },
      { status: 500 }
    );
  }
}
