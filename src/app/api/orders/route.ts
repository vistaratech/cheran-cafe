import { NextResponse } from 'next/server';
import { getInitialOrders, updateOrderStatus, addOrder, deleteOrder, updateOrder, toggleOrderPin, updateOrderItemStatus, swapOrderPositions } from '@/lib/database-service';
import { debugOrders } from '@/lib/helpers';

// Import the SSE update function
import { sendOrderUpdate } from './events/route';

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

// Helper function to send SSE updates after order changes
function notifyOrderUpdate() {
  try {
    sendOrderUpdate();
  } catch (error) {
    console.error('Error sending SSE update:', error);
  }
}

export async function GET(request: Request) {
  // @ts-ignore - params is accessed through a different mechanism
  const params = undefined;
  // @ts-ignore - accessing id property on resolved params
  if (params && params['id']) {
    try {
      const { id } = await params;
      debugOrders('GET: fetching specific order with id %s', id);
      
      if (!id) {
        debugOrders('GET: order ID is required');
        return NextResponse.json(
          createApiResponse(undefined, "Order ID is required"),
          { status: 400 }
        );
      }
      
      const orderId = parseInt(id);
      if (isNaN(orderId)) {
        debugOrders('GET: invalid order ID %s', id);
        return NextResponse.json(
          createApiResponse(undefined, "Invalid order ID"),
          { status: 400 }
        );
      }
      
      // Get restaurantId from query params
      const { searchParams } = new URL(request.url);
      const restaurantId = searchParams.get('restaurantId');
      
      if (!restaurantId) {
        return NextResponse.json(
          createApiResponse(undefined, "restaurantId is required"),
          { status: 400 }
        );
      }
      
      const orders = await getInitialOrders(restaurantId);
      const order = orders.find(o => o.id === orderId);
      
      if (!order) {
        debugOrders('GET: order not found with id %d', orderId);
        return NextResponse.json(
          createApiResponse(undefined, "Order not found"),
          { status: 404 }
        );
      }
      
      debugOrders('GET: successfully found order with id %d', orderId);
      return NextResponse.json(
        createApiResponse(order),
        { status: 200 }
      );
    } catch (error: any) {
      debugOrders('GET: error fetching order: %O', error);
      console.error('Error fetching order:', error);
      return NextResponse.json(
        createApiResponse(undefined, error.message || 'Failed to fetch order'),
        { status: 500 }
      );
    }
  }
  
  // Handle GET /api/orders - get all orders for a restaurant
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    
    if (!restaurantId) {
      return NextResponse.json(
        createApiResponse(undefined, "restaurantId is required"),
        { status: 400 }
      );
    }
    
    debugOrders('GET: fetching orders for restaurant %s', restaurantId);
    const orders = await getInitialOrders(restaurantId);
    debugOrders('GET: successfully fetched %d orders', orders.length);
    return NextResponse.json(
      createApiResponse(orders),
      { status: 200 }
    );
  } catch (error: any) {
    debugOrders('GET: error fetching orders: %O', error);
    console.error('Error fetching orders:', error);
    // Return appropriate HTTP status based on error type
    const status = error.message?.includes('Database connection failed') ? 503 : 500;
    return NextResponse.json(
      createApiResponse(undefined, error.message || 'Failed to fetch orders'),
      { status }
    );
  }
}

export async function POST(request: Request, context: any = {}) {
  try {
    debugOrders('POST: creating new order');
    const orderData = await request.json();
    debugOrders('POST: order data %O', orderData);
    
    // Validate restaurantId
    if (!orderData.restaurantId) {
      return NextResponse.json(
        createApiResponse(undefined, "restaurantId is required"),
        { status: 400 }
      );
    }

    // Validate items
    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        createApiResponse(undefined, "Order must contain at least one item"),
        { status: 400 }
      );
    }
    
    const newOrder = await addOrder(orderData);
    debugOrders('POST: successfully created order with id %d', newOrder.id);
    
    // Notify clients of the update
    notifyOrderUpdate();
    
    return NextResponse.json(
      createApiResponse(newOrder),
      { status: 201 }
    );
  } catch (error: any) {
    debugOrders('POST: error adding order: %O', error);
    console.error('Error adding order:', error);
    return NextResponse.json(
      createApiResponse(undefined, error.message || 'Failed to add order'),
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  // @ts-ignore - params is accessed through a different mechanism
  const params = undefined;
  debugOrders('PUT: request received with params %O', params);
  // Handle PUT /api/orders/[id] - update specific order
  // @ts-ignore - accessing id property
  if (params?.id) {
    try {
      const { id } = await params;
      const body = await request.json();
      debugOrders('PUT: updating order %s with data %O', id, body);
      
      if (!id) {
        debugOrders('PUT: order ID is required');
        return NextResponse.json(
          createApiResponse(undefined, "Order ID is required"),
          { status: 400 }
        );
      }
      
      const orderId = parseInt(id);
      if (isNaN(orderId)) {
        debugOrders('PUT: invalid order ID %s', id);
        return NextResponse.json(
          createApiResponse(undefined, "Invalid order ID"),
          { status: 400 }
        );
      }
      
      // Remove fields that should not be updated directly
      const { id: _, _id, __v, createdAt, restaurantId, ...updateData } = body;
      
      if (!restaurantId) {
        debugOrders('PUT: restaurantId is required');
        return NextResponse.json(
          createApiResponse(undefined, "restaurantId is required"),
          { status: 400 }
        );
      }
      
      // Transform items data to match database structure
      if (updateData.items) {
        updateData.items = updateData.items.map((item: any) => ({
          ...item,
          name: item.name || item.menuItem?.name,  // Preserve name field
          price: item.price || item.menuItem?.price,  // Preserve price field
          menuItemId: item.menuItem?.id || item.menuItemId,
          selectedExtraIds: item.selectedExtras?.map((extra: any) => extra.id) || item.selectedExtraIds || [],
          workstationId: item.workstationId || null // Preserve workstationId
        }));
      }
      
      const result = await updateOrder(orderId, restaurantId, updateData);
      
      if (!result) {
        debugOrders('PUT: order not found or could not be updated, id %d', orderId);
        return NextResponse.json(
          createApiResponse(undefined, "Order not found or could not be updated"),
          { status: 404 }
        );
      }
      
      debugOrders('PUT: successfully updated order %d', orderId);
      
      // Notify clients of the update
      notifyOrderUpdate();
      
      return NextResponse.json(
        createApiResponse({ success: true }),
        { status: 200 }
      );
    } catch (error: any) {
      debugOrders('PUT: error updating order: %O', error);
      console.error('Error updating order:', error);
      return NextResponse.json(
        createApiResponse(undefined, error.message || 'Failed to update order'),
        { status: 500 }
      );
    }
  }
  
  // Handle PUT /api/orders - update order status or item status
  try {
    const body = await request.json();
    debugOrders('PUT: updating order status with data %O', body);
    
    // Handle update item status
    if ('itemId' in body && 'status' in body) {
      const { orderId, itemId, status, moveToNextWorkstation, moveToPreviousWorkstation, nextWorkstationId, previousWorkstationId } = body;
      debugOrders('PUT: updating item %s status to %s in order %d', itemId, status, orderId);
      const result = await updateOrderItemStatus({ 
        orderId, 
        itemId, 
        status, 
        moveToNextWorkstation, 
        moveToPreviousWorkstation,  // Add this parameter
        nextWorkstationId, 
        previousWorkstationId       // Add this parameter
      });
      debugOrders('PUT: successfully updated item status');
      
      // Notify clients of the update
      notifyOrderUpdate();
      
      return NextResponse.json(
        createApiResponse(result),
        { status: 200 }
      );
    }
    
    // Handle update item positions
    if (body.type === 'updateItemPositions') {
      const { orderId, positions, restaurantId } = body;
      debugOrders('PUT: updating item positions in order %d with data %O', orderId, positions);
      
      if (!restaurantId) {
        return NextResponse.json(
          createApiResponse(undefined, "restaurantId is required"),
          { status: 400 }
        );
      }
      
      // Get the order
      const orders = await getInitialOrders(restaurantId);
      const order = orders.find(o => o.id === orderId);
      
      if (!order) {
        return NextResponse.json(
          createApiResponse(undefined, "Order not found"),
          { status: 404 }
        );
      }
      
      // Update item positions
      const updatedItems = order.items.map(item => {
        const positionUpdate = positions.find((p: any) => p.itemId === item.id);
        if (positionUpdate) {
          return { ...item, position: positionUpdate.position };
        }
        return item;
      });
      
      // Update the order in the database
      await updateOrder(orderId, restaurantId, { items: updatedItems });
      
      debugOrders('PUT: successfully updated item positions');
      
      // Notify clients of the update
      notifyOrderUpdate();
      
      return NextResponse.json(
        createApiResponse({ success: true }),
        { status: 200 }
      );
    }
    
    // Handle update order status
    const { orderId, newStatus, restaurantId } = body;
    
    if (!restaurantId) {
      return NextResponse.json(
        createApiResponse(undefined, "restaurantId is required"),
        { status: 400 }
      );
    }
    
    debugOrders('PUT: updating order %d status to %s', orderId, newStatus);
    await updateOrderStatus(orderId, restaurantId, newStatus);
    debugOrders('PUT: successfully updated order status');
    
    // Notify clients of the update
    notifyOrderUpdate();
    
    return NextResponse.json(
      createApiResponse({ success: true }),
      { status: 200 }
    );
  } catch (error: any) {
    debugOrders('PUT: error updating order status: %O', error);
    console.error('Error updating order status:', error);
    return NextResponse.json(
      createApiResponse(undefined, error.message || 'Failed to update order status'),
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  // @ts-ignore - params is accessed through a different mechanism
  const params = undefined;
  debugOrders('PATCH: request received with params %O', params);
  // Handle PATCH /api/orders/[id]/pin - toggle order pin
  // @ts-ignore - accessing id property
  if (params?.id) {
    try {
      const { id } = await params;
      debugOrders('PATCH: toggling pin for order %s', id);
      
      if (!id) {
        debugOrders('PATCH: order ID is required');
        return NextResponse.json(
          createApiResponse(undefined, "Order ID is required"),
          { status: 400 }
        );
      }
      
      const orderId = parseInt(id);
      if (isNaN(orderId)) {
        debugOrders('PATCH: invalid order ID %s', id);
        return NextResponse.json(
          createApiResponse(undefined, "Invalid order ID"),
          { status: 400 }
        );
      }
      
      const result = await toggleOrderPin({ orderId });
      
      if (!result.success) {
        debugOrders('PATCH: failed to toggle order pin for order %d', orderId);
        return NextResponse.json(
          createApiResponse(undefined, result.error || 'Failed to toggle order pin'),
          { status: 500 }
        );
      }
      
      debugOrders('PATCH: successfully toggled pin for order %d', orderId);
      
      // Notify clients of the update
      notifyOrderUpdate();
      
      return NextResponse.json(
        createApiResponse(result),
        { status: 200 }
      );
    } catch (error: any) {
      debugOrders('PATCH: error toggling order pin: %O', error);
      console.error('Error toggling order pin:', error);
      return NextResponse.json(
        createApiResponse(undefined, error.message || 'Failed to toggle order pin'),
        { status: 500 }
      );
    }
  }
  
  // Handle PATCH /api/orders - toggle order pin (legacy) or reorder
  try {
    const body = await request.json();
    debugOrders('PATCH: received body %O', body);
    
    // Handle order reordering
    if (body.type === 'reorder') {
      const { orderId, targetOrderId } = body;
      debugOrders('PATCH: swapping order %d with order %d', orderId, targetOrderId);
      
      // Use the actual function to swap order positions
      const result = await swapOrderPositions(orderId, targetOrderId);
      
      if (!result.success) {
        debugOrders('PATCH: failed to swap orders: %s', result.error);
        return NextResponse.json(
          createApiResponse(undefined, result.error || 'Failed to swap orders'),
          { status: 500 }
        );
      }
      
      debugOrders('PATCH: successfully swapped orders');
      
      // Notify clients of the update
      notifyOrderUpdate();
      
      return NextResponse.json(
        createApiResponse(result),
        { status: 200 }
      );
    }
    
    // Handle existing pin functionality if no type is specified
    const { orderId } = body;
    debugOrders('PATCH: toggling pin for order (legacy) %d', orderId);
    const result = await toggleOrderPin({ orderId });
    
    if (!result.success) {
      debugOrders('PATCH: failed to toggle order pin for order %d', orderId);
      return NextResponse.json(
        createApiResponse(undefined, result.error || 'Failed to toggle order pin'),
        { status: 500 }
      );
    }
    
    debugOrders('PATCH: successfully toggled pin for order %d', orderId);
    
    // Notify clients of the update
    notifyOrderUpdate();
    
    return NextResponse.json(
      createApiResponse(result),
      { status: 200 }
    );
  } catch (error: any) {
    debugOrders('PATCH: error in order operation: %O', error);
    console.error('Error in order operation:', error);
    return NextResponse.json(
      createApiResponse(undefined, error.message || 'Failed to process order operation'),
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: { params: Promise<{}> }) {
  // @ts-ignore
  const resolvedParams = context.params ? await context.params : undefined;
  // @ts-ignore
  const params = resolvedParams;
  try {
    // @ts-ignore
    const { id } = params && params['id'] ? params : { id: '' };
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
    
    // Get restaurantId from query params
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    
    if (!restaurantId) {
      return NextResponse.json(
        createApiResponse(undefined, "restaurantId is required"),
        { status: 400 }
      );
    }
    
    const result = await deleteOrder(orderId, restaurantId);
    
    if (!result) {
      debugOrders('DELETE: order not found or could not be deleted, id %d', orderId);
      return NextResponse.json(
        createApiResponse(undefined, "Order not found or could not be deleted"),
        { status: 404 }
      );
    }
    
    debugOrders('DELETE: successfully deleted order %d', orderId);
    
    // Notify clients of the update
    notifyOrderUpdate();
    
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