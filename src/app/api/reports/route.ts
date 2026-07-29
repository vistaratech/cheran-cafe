import { NextResponse } from 'next/server';
import { getInitialOrders } from '@/lib/database-service';
import { format, eachDayOfInterval, parseISO, differenceInMinutes } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { MenuItem } from '@/lib/types';

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

// Helper function to calculate order total
const getOrderTotal = (order: any): number => {
  return order.items.reduce((total: number, item: any) => {
    return total + (item.menuItem.price * item.quantity);
  }, 0);
};

// Helper function to filter orders by date range
function filterOrdersByDateRange(orders: any[], dateRange?: DateRange) {
  if (!dateRange || !dateRange.from) return orders;
  
  const from = dateRange.from;
  const to = dateRange.to || new Date();
  
  return orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= from && orderDate <= to;
  });
}

// Generate sales report data
function generateSalesReport(orders: any[]) {
  const totalRevenue = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Group orders by date for daily sales
  const dailySalesMap: { [key: string]: number } = {};
  
  orders.forEach(order => {
    const dateStr = format(new Date(order.createdAt), 'yyyy-MM-dd');
    const orderTotal = getOrderTotal(order);
    
    if (dailySalesMap[dateStr]) {
      dailySalesMap[dateStr] += orderTotal;
    } else {
      dailySalesMap[dateStr] = orderTotal;
    }
  });
  
  const dailySales = Object.entries(dailySalesMap)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return {
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalOrders,
    avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
    dailySales
  };
}

// Generate item report data
function generateItemReport(orders: any[]) {
  // Count item quantities and revenue
  const itemStats: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
  
  orders.forEach(order => {
    order.items.forEach((item: any) => {
      const menuItem = item.menuItem as MenuItem;
      const itemId = menuItem.id;
      const quantity = item.quantity;
      const itemRevenue = menuItem.price * quantity;
      
      if (itemStats[itemId]) {
        itemStats[itemId].quantity += quantity;
        itemStats[itemId].revenue += itemRevenue;
      } else {
        itemStats[itemId] = {
          name: menuItem.name,
          quantity,
          revenue: itemRevenue
        };
      }
    });
  });
  
  // Convert to array and sort
  const items = Object.values(itemStats);
  const bestSelling = [...items].sort((a, b) => b.quantity - a.quantity);
  const leastSelling = [...items].sort((a, b) => a.quantity - b.quantity);
  
  return {
    bestSelling: bestSelling.map(item => ({
      ...item,
      revenue: parseFloat(item.revenue.toFixed(2))
    })),
    leastSelling: leastSelling.map(item => ({
      ...item,
      revenue: parseFloat(item.revenue.toFixed(2))
    }))
  };
}

// Generate kitchen report data
function generateKitchenReport(orders: any[]) {
  // Calculate average preparation time
  let totalPrepTime = 0;
  let completedItems = 0;
  
  orders.forEach(order => {
    if (order.statusHistory) {
      // Find when the order was created and when it was completed
      const createdEvent = order.statusHistory.find((event: any) => event.status === 'pending');
      const completedEvent = order.statusHistory.find((event: any) => event.status === 'completed');
      
      if (createdEvent && completedEvent) {
        const createdTime = new Date(createdEvent.timestamp);
        const completedTime = new Date(completedEvent.timestamp);
        const prepTime = differenceInMinutes(completedTime, createdTime);
        
        if (prepTime > 0) {
          totalPrepTime += prepTime;
          completedItems += order.items.length;
        }
      }
    }
  });
  
  const avgPrepTime = completedItems > 0 ? totalPrepTime / completedItems : 0;
  
  // Find most delayed items (simplified)
  const itemDelays: Record<string, { name: string; totalTime: number; count: number }> = {};
  
  orders.forEach(order => {
    if (order.statusHistory) {
      const createdEvent = order.statusHistory.find((event: any) => event.status === 'pending');
      const completedEvent = order.statusHistory.find((event: any) => event.status === 'completed');
      
      if (createdEvent && completedEvent) {
        const createdTime = new Date(createdEvent.timestamp);
        const completedTime = new Date(completedEvent.timestamp);
        const prepTime = differenceInMinutes(completedTime, createdTime);
        
        if (prepTime > 0) {
          order.items.forEach((item: any) => {
            const itemId = item.menuItem.id;
            if (!itemDelays[itemId]) {
              itemDelays[itemId] = {
                name: item.menuItem.name,
                totalTime: 0,
                count: 0
              };
            }
            
            itemDelays[itemId].totalTime += prepTime;
            itemDelays[itemId].count += 1;
          });
        }
      }
    }
  });
  
  // Calculate average delay per item
  const delayedItems = Object.values(itemDelays)
    .map(item => ({
      name: item.name,
      avgTime: item.count > 0 ? item.totalTime / item.count : 0
    }))
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 10); // Top 10 most delayed items
  
  return {
    avgPrepTime: parseFloat(avgPrepTime.toFixed(2)),
    mostDelayed: delayedItems.map(item => ({
      ...item,
      avgTime: parseFloat(item.avgTime.toFixed(2))
    }))
  };
}

export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    
    let dateRange: DateRange | undefined;
    if (from) {
      dateRange = {
        from: parseISO(from),
        to: to ? parseISO(to) : undefined
      };
    }
    
    // Get all orders
    const allOrders = await getInitialOrders();
    
    // Filter by date range
    const filteredOrders = filterOrdersByDateRange(allOrders, dateRange);
    
    // Generate reports
    const salesReport = generateSalesReport(filteredOrders);
    const itemReport = generateItemReport(filteredOrders);
    const kitchenReport = generateKitchenReport(filteredOrders);
    
    const reports = {
      sales: salesReport,
      items: itemReport,
      kitchen: kitchenReport
    };
    
    return NextResponse.json(
      createApiResponse(reports),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error generating reports:', error);
    
    return NextResponse.json(
      createApiResponse(undefined, 'Failed to generate reports'),
      { status: 500 }
    );
  }
}