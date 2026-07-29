import { NextResponse } from 'next/server';
import { getPaymentMethods, updatePaymentMethod, deletePaymentMethod } from '@/lib/database-service';

// GET /api/payments/[id] - get specific payment method
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    const payments = await getPaymentMethods();
    const method = payments.find(m => m.id === (params ? params['id'] : undefined));
    
    if (!method) {
      return NextResponse.json(
        { success: false, error: 'Payment method not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: method });
  } catch (error: any) {
    console.error('Error fetching payment method:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch payment method' },
      { status: 500 }
    );
  }
}

// PUT /api/payments/[id] - update specific payment method
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updatedMethod = await updatePaymentMethod(params ? params['id'] : '', body);
    
    if (updatedMethod) {
      return NextResponse.json({ 
        success: true,
        data: updatedMethod 
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: 'Payment method not found or not updated' 
        },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to update payment method' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/payments/[id] - delete specific payment method
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    if (!params?.id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Payment method ID is required' 
        },
        { status: 400 }
      );
    }
    
    const result = await deletePaymentMethod(params ? params['id'] : '');
    if (result) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: 'Payment method not found or not deleted' 
        },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to delete payment method' 
      },
      { status: 500 }
    );
  }
}