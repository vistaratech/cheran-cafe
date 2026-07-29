import { NextResponse } from 'next/server';
import { getCategories, addCategory } from '@/lib/database-service';
import { type Category } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    
    if (!restaurantId) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          error: 'restaurantId is required',
          message: 'restaurantId query parameter is required'
        },
        { status: 400 }
      );
    }
    
    const categories = await getCategories(restaurantId);
    return NextResponse.json({
      success: true,
      data: categories,
      error: null,
      message: null
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    // Return appropriate HTTP status based on error type
    const status = error.message?.includes('Database connection failed') ? 503 : 500;
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch categories',
        message: error.message || 'An unknown error occurred'
      },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;
    
    if (action === 'addCategory' && data) {
      if (!data.restaurantId) {
        return NextResponse.json(
          { error: 'restaurantId is required for category operations' },
          { status: 400 }
        );
      }
      const newCategory = await addCategory(data as Omit<Category, 'id'> & { restaurantId: string });
      return NextResponse.json(newCategory);
    } else {
      return NextResponse.json(
        { error: 'Invalid request format or missing data' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error adding category:', error);
    const status = error.message?.includes('Database connection failed') ? 503 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to add category' },
      { status }
    );
  }
}