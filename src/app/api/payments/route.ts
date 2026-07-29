import { NextResponse } from 'next/server';
import { getPaymentMethods, addPaymentMethod } from '@/lib/database-service';

// GET /api/payments - get all payment methods for a restaurant
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
        },
        { status: 400 }
      );
    }
    
    const payments = await getPaymentMethods(restaurantId);
    return NextResponse.json({
      success: true,
      data: payments,
      error: null,
    });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch payments',
      },
      { status: 500 }
    );
  }
}

// POST /api/payments - create a new payment method
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate restaurantId
    if (!data.restaurantId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'restaurantId is required' 
        },
        { status: 400 }
      );
    }
    
    const newMethod = await addPaymentMethod(data);
    return NextResponse.json({ 
      success: true,
      data: newMethod 
    });
  } catch (error: any) {
    console.error('Error adding payment method:', error);
    // Log the error details
    if (error.name === 'ValidationError') {
      console.error('Validation error details:', error.errors);
    }
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to add payment method' 
      },
      { status: 500 }
    );
  }
}