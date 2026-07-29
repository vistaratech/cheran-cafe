import { NextResponse } from 'next/server';
import { 
  addMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  addCategory,
  updateCategory,
  deleteCategory,
  getMenuItems
} from '@/lib/database-service';
import { debugMenu } from '@/lib/helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId') || undefined;
    
    debugMenu('GET: fetching menu items for restaurant %s', restaurantId || 'all');
    const menuItems = await getMenuItems(restaurantId);
    debugMenu('GET: successfully fetched %d menu items', menuItems.length);
    return NextResponse.json({
      success: true,
      data: menuItems,
      error: null,
      message: null
    });
  } catch (error: any) {
    debugMenu('GET: error fetching menu items: %O', error);
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch menu items',
        message: error.message || 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    debugMenu('POST: received request with action %s', body.action);
    
    switch (body.action) {
      case 'addMenuItem':
        debugMenu('POST: adding new menu item with data %O', body.data);
        if (!body.data.restaurantId) {
          return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
        }
        const newMenuItem = await addMenuItem(body.data);
        debugMenu('POST: successfully added menu item with id %s', newMenuItem.id);
        return NextResponse.json(newMenuItem);
        
      case 'addCategory':
        debugMenu('POST: adding new category with data %O', body.data);
        if (!body.data.restaurantId) {
          return NextResponse.json({ error: 'restaurantId is required for category operations' }, { status: 400 });
        }
        const newCategory = await addCategory({ ...body.data, restaurantId: body.data.restaurantId });
        debugMenu('POST: successfully added category with id %s', newCategory.id);
        return NextResponse.json(newCategory);
        
      case 'updateCategory':
        debugMenu('POST: updating category %s with data %O', body.id, body.data);
        if (!body.data.restaurantId) {
          return NextResponse.json({ error: 'restaurantId is required for category operations' }, { status: 400 });
        }
        const updatedCategory = await updateCategory(body.id, body.data.restaurantId, body.data);
        debugMenu('POST: successfully updated category %s', body.id);
        return NextResponse.json(updatedCategory);
        
      default:
        debugMenu('POST: invalid action %s', body.action);
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    debugMenu('POST: error in menu operations: %O', error);
    console.error('Error in menu operations:', error);
    return NextResponse.json(
      { error: 'Failed to perform menu operation' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    debugMenu('PUT: received request with action %s', body.action);
    
    switch (body.action) {
      case 'updateCategory':
        debugMenu('PUT: updating category %s with data %O', body.id, body.data);
        if (!body.data.restaurantId) {
          return NextResponse.json({ error: 'restaurantId is required for category operations' }, { status: 400 });
        }
        const updatedCategory = await updateCategory(body.id, body.data.restaurantId, body.data);
        debugMenu('PUT: successfully updated category %s', body.id);
        return NextResponse.json(updatedCategory);
        
      case 'updateMenuItem':
        debugMenu('PUT: updating menu item %s with data %O', body.id, body.data);
        const updatedItem = await updateMenuItem(body.id, body.data);
        if (updatedItem) {
          debugMenu('PUT: successfully updated menu item %s', body.id);
          return NextResponse.json(updatedItem);
        } else {
          debugMenu('PUT: failed to update menu item %s', body.id);
          return NextResponse.json(
            { error: 'Failed to update menu item' },
            { status: 500 }
          );
        }
        
      default:
        debugMenu('PUT: invalid action %s', body.action);
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    debugMenu('PUT: error updating menu: %O', error);
    console.error('Error updating menu:', error);
    return NextResponse.json(
      { error: 'Failed to update menu' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    debugMenu('DELETE: received request with action %s', body.action);
    
    switch (body.action) {
      case 'deleteMenuItem':
        debugMenu('DELETE: deleting menu item %s', body.id);
        const deleteResult = await deleteMenuItem(body.id);
        if (deleteResult) {
          debugMenu('DELETE: successfully deleted menu item %s', body.id);
          return NextResponse.json({ success: true });
        } else {
          debugMenu('DELETE: failed to delete menu item %s', body.id);
          return NextResponse.json(
            { error: 'Failed to delete menu item' },
            { status: 500 }
          );
        }
        
      case 'deleteMenuItems':
        // Delete multiple menu items
        debugMenu('DELETE: deleting %d menu items', body.ids.length);
        const results = await Promise.all(body.ids.map((id: string) => deleteMenuItem(id)));
        const successCount = results.filter(result => result).length;
        debugMenu('DELETE: successfully deleted %d menu items', successCount);
        if (successCount === body.ids.length) {
          return NextResponse.json({ success: true });
        } else {
          return NextResponse.json(
            { error: `Failed to delete ${body.ids.length - successCount} menu items` },
            { status: 500 }
          );
        }
        
      case 'deleteCategory':
        debugMenu('DELETE: deleting category %s', body.id);
        if (!body.data?.restaurantId) {
          return NextResponse.json({ error: 'restaurantId is required for category operations' }, { status: 400 });
        }
        await deleteCategory(body.id, body.data.restaurantId);
        debugMenu('DELETE: successfully deleted category %s', body.id);
        return NextResponse.json({ success: true });
        
      default:
        debugMenu('DELETE: invalid action %s', body.action);
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    debugMenu('DELETE: error deleting menu items: %O', error);
    console.error('Error deleting menu items:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu items' },
      { status: 500 }
    );
  }
}