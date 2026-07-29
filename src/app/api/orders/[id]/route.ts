import { NextResponse } from 'next/server';
import { deleteOrder, updateOrder } from '@/lib/database-service';
import { debugOrders } from '@/lib/helpers';
import { sendOrderUpdate } from '../events/route';

// Define response structure
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Helper function to create standardized API responses
function createApiResponse<T>(data?: T, error?: string): ApiResponse<T> {
  return {
    success: !error,
    data,
    error,
    timestamp: new Date().toISOString()
  };
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = await context;
  try {
    const { id } = await params;
    const body = await request.json();
    debugOrders('PUT [id]: updating order %s with data %O', id, body);

    if (!id) {
      debugOrders('PUT [id]: order ID is required');
      return NextResponse.json(
        createApiResponse(undefined, "Order ID is required"),
        { status: 400 }
      );
    }

    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      debugOrders('PUT [id]: invalid order ID %s', id);
      return NextResponse.json(
        createApiResponse(undefined, "Invalid order ID"),
        { status: 400 }
      );
    }

    const { restaurantId } = body;
    if (!restaurantId) {
      debugOrders('PUT [id]: restaurantId is required');
      return NextResponse.json(
        createApiResponse(undefined, "restaurantId is required"),
        { status: 400 }
      );
    }

    // Transform items data to match database structure
    const updateData = { ...body };
    if (updateData.items) {
      updateData.items = updateData.items.map((item: any) => ({
        ...item,
        name: item.name || item.menuItem?.name,
        price: item.price || item.menuItem?.price,
        menuItemId: item.menuItem?.id || item.menuItemId,
        selectedExtraIds: item.selectedExtras?.map((extra: any) => extra.id) || item.selectedExtraIds || [],
        workstationId: item.workstationId || null
      }));
    }

    const result = await updateOrder(orderId, restaurantId, updateData);

    if (!result) {
      debugOrders('PUT [id]: order not found or could not be updated, id %d', orderId);
      return NextResponse.json(
        createApiResponse(undefined, "Order not found or could not be updated"),
        { status: 404 }
      );
    }

    debugOrders('PUT [id]: successfully updated order %d', orderId);
    sendOrderUpdate();

    return NextResponse.json(
      createApiResponse({ success: true }),
      { status: 200 }
    );
  } catch (error: any) {
    debugOrders('PUT [id]: error updating order: %O', error);
    console.error('Error updating order:', error);
    return NextResponse.json(
      createApiResponse(undefined, error.message || 'Failed to update order'),
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> } = { params: Promise.resolve({ id: '' }) }) {
  const { params } = await context;
  try {
    const { id } = await params;
    debugOrders('DELETE: deleting order %s', id);
    
    if (!id) {
      debugOrders('DELETE: order ID is required');
      return NextResponse.json(
        createApiResponse(undefined, "Order ID is required"),
        { status: 400 }
      );
    }
    
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      debugOrders('DELETE: invalid order ID %s', id);
      return NextResponse.json(
        createApiResponse(undefined, "Invalid order ID"),
        { status: 400 }
      );
    }
    
    const result = await deleteOrder(orderId);
    
    if (!result) {
      debugOrders('DELETE: order not found or could not be deleted, id %d', orderId);
      return NextResponse.json(
        createApiResponse(undefined, "Order not found or could not be deleted"),
        { status: 404 }
      );
    }
    
    debugOrders('DELETE: successfully deleted order %d', orderId);
    return NextResponse.json(
      createApiResponse({ success: true }),
      { status: 200 }
    );
  } catch (error: any) {
    debugOrders('DELETE: error deleting order: %O', error);
    console.error('Error deleting order:', error);
    return NextResponse.json(
      createApiResponse(undefined, error.message || 'Failed to delete order'),
      { status: 500 }
    );
  }
}