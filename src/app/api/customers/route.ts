import { NextResponse } from 'next/server';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '@/lib/database-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, data: [], error: 'restaurantId is required' },
        { status: 400 }
      );
    }

    const customers = await getCustomers(restaurantId);
    return NextResponse.json({
      success: true,
      data: customers,
      error: null,
      message: null
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch customers',
        message: error.message || 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      );
    }
    
    const newCustomer = await addCustomer(body);
    return NextResponse.json(newCustomer);
  } catch (error: any) {
    console.error('Error adding customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add customer' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...customerData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }
    
    const result = await updateCustomer(id, customerData);
    if (result) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to update customer' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }
    
    const result = await deleteCustomer(id);
    if (result) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete customer' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete customer' },
      { status: 500 }
    );
  }
}