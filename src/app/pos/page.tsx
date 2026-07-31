"use client"
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { type MenuItem, type OrderItem, type Order, type Payment } from '@/lib/types';
import { CurrentOrder } from '@/components/pos/order-panel';
import { MenuSelection } from '@/components/pos/menu-panel';
import { AddItemDialog } from '@/components/pos/dialogs/add-item-modal';
import { PaymentDialogRefactored } from '@/components/pos/dialogs/payment-modal';
import { SheetCart } from '@/components/pos/cart-sheet';
import { toast } from "sonner";
import { useI18nStore } from '@/lib/stores/i18n-store';
import { useUserStore } from '@/lib/stores/user-store';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, File, Search, History, Settings, Home, ClipboardList, Users, BarChart, ShoppingCart, ChefHat, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { ReceiptDialog } from '@/components/pos/dialogs/receipt-modal'
import { OrderDetailsDialog } from '@/components/pos/dialogs/order-details-modal'
import { getOrderTotal } from '@/lib/helpers'
import { useCallback } from 'react'
import { type Category } from '@/lib/types'
import { useCurrentOrderStoreCompat as useCurrentOrderStore, useCurrentOrderTotalsCompat as useCurrentOrderTotals, useCurrentOrderItemCountByCategoryCompat as useCurrentOrderItemCountByCategory } from '@/lib/stores/current-order-store';
import { fetcher } from '@/lib/swr-fetcher';

import { getFoodImageUrl } from '@/lib/food-images';

const FAST_CATEGORIES: Category[] = [
  { id: 1, name: 'Snacks' },
  { id: 2, name: 'Hot' },
  { id: 3, name: 'Falooda' },
  { id: 4, name: 'Cheran Special' },
];

const FAST_MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Egg Puffs', price: 25.00, category: 'Snacks', imageUrl: getFoodImageUrl('Egg Puffs', 'Snacks'), sortIndex: 0, available: true },
  { id: '2', name: 'Paneer Puffs', price: 25.00, category: 'Snacks', imageUrl: getFoodImageUrl('Paneer Puffs', 'Snacks'), sortIndex: 0, available: true },
  { id: '3', name: 'Chicken Puffs', price: 30.00, category: 'Snacks', imageUrl: getFoodImageUrl('Chicken Puffs', 'Snacks'), sortIndex: 0, available: true },
  { id: '4', name: 'Mushroom Puffs', price: 25.00, category: 'Snacks', imageUrl: getFoodImageUrl('Mushroom Puffs', 'Snacks'), sortIndex: 0, available: true },
  { id: '5', name: 'Veg Puffs', price: 20.00, category: 'Snacks', imageUrl: getFoodImageUrl('Veg Puffs', 'Snacks'), sortIndex: 0, available: true },
  { id: '6', name: 'Egg Roll', price: 35.00, category: 'Snacks', imageUrl: getFoodImageUrl('Egg Roll', 'Snacks'), sortIndex: 0, available: true },
  { id: '7', name: 'Chicken Roll', price: 40.00, category: 'Snacks', imageUrl: getFoodImageUrl('Chicken Roll', 'Snacks'), sortIndex: 0, available: true },
  { id: '8', name: 'Tea', price: 20.00, category: 'Hot', imageUrl: getFoodImageUrl('Tea', 'Hot'), sortIndex: 0, available: true },
  { id: '9', name: 'Lemon Tea', price: 20.00, category: 'Hot', imageUrl: getFoodImageUrl('Lemon Tea', 'Hot'), sortIndex: 0, available: true },
  { id: '10', name: 'Green Tea', price: 20.00, category: 'Hot', imageUrl: getFoodImageUrl('Green Tea', 'Hot'), sortIndex: 0, available: true },
  { id: '11', name: 'Badam', price: 25.00, category: 'Hot', imageUrl: getFoodImageUrl('Badam', 'Hot'), sortIndex: 0, available: true },
  { id: '12', name: 'Boost', price: 30.00, category: 'Hot', imageUrl: getFoodImageUrl('Boost', 'Hot'), sortIndex: 0, available: true },
  { id: '13', name: 'Horlicks', price: 30.00, category: 'Hot', imageUrl: getFoodImageUrl('Horlicks', 'Hot'), sortIndex: 0, available: true },
  { id: '14', name: 'Mango Falooda', price: 119.00, category: 'Falooda', imageUrl: getFoodImageUrl('Mango Falooda', 'Falooda'), sortIndex: 0, available: true },
  { id: '15', name: 'Dry Fruit Falooda', price: 139.00, category: 'Falooda', imageUrl: getFoodImageUrl('Dry Fruit Falooda', 'Falooda'), sortIndex: 0, available: true },
  { id: '16', name: 'Rose Falooda', price: 129.00, category: 'Falooda', imageUrl: getFoodImageUrl('Rose Falooda', 'Falooda'), sortIndex: 0, available: true },
  { id: '17', name: 'Special Cheran Falooda', price: 169.00, category: 'Falooda', imageUrl: getFoodImageUrl('Special Cheran Falooda', 'Falooda'), sortIndex: 0, available: true },
  { id: '18', name: 'Avil Milk', price: 90.00, category: 'Falooda', imageUrl: getFoodImageUrl('Avil Milk', 'Falooda'), sortIndex: 0, available: true },
  { id: '19', name: 'Cocktail Shake', price: 149.00, category: 'Cheran Special', imageUrl: getFoodImageUrl('Cocktail Shake', 'Cheran Special'), sortIndex: 0, available: true },
  { id: '20', name: 'Royal Falooda', price: 159.00, category: 'Cheran Special', imageUrl: getFoodImageUrl('Royal Falooda', 'Cheran Special'), sortIndex: 0, available: true },
  { id: '21', name: 'Fruit Salad with Ice Cream', price: 99.00, category: 'Cheran Special', imageUrl: getFoodImageUrl('Fruit Salad with Ice Cream', 'Cheran Special'), sortIndex: 0, available: true },
  { id: '22', name: 'Sizzling Brownie', price: 179.00, category: 'Cheran Special', imageUrl: getFoodImageUrl('Sizzling Brownie', 'Cheran Special'), sortIndex: 0, available: true },
  { id: '23', name: 'Choco Lava Cake', price: 89.00, category: 'Cheran Special', imageUrl: getFoodImageUrl('Choco Lava Cake', 'Cheran Special'), sortIndex: 0, available: true },
  { id: '24', name: 'KitKat Milkshake', price: 119.00, category: 'Cheran Special', imageUrl: getFoodImageUrl('KitKat Milkshake', 'Cheran Special'), sortIndex: 0, available: true },
];

function PosPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editingOrderItem, setEditingOrderItem] = useState<OrderItem | null>(null);
  const [isPaymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSendingToKitchen, setIsSendingToKitchen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isEditingOrder, setIsEditingOrder] = useState<Order | null>(null);

  const { t } = useI18nStore();
  const user = useUserStore((state) => state.getCurrentUser());

  const restId = user?.restaurantId || 'rest-default';

  // SWR data fetching with instant zero-delay fallbacks
  const { data: menuItems = FAST_MENU_ITEMS, mutate: mutateMenuItems } = useSWR<MenuItem[]>(
    `/api/menu?restaurantId=${encodeURIComponent(restId)}`,
    fetcher as any,
    {
      fallbackData: FAST_MENU_ITEMS,
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const { data: categories = FAST_CATEGORIES, mutate: mutateCategories } = useSWR<Category[]>(
    `/api/categories?restaurantId=${encodeURIComponent(restId)}`,
    fetcher as any,
    {
      fallbackData: FAST_CATEGORIES,
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const { data: workstations = [], mutate: mutateWorkstations } = useSWR<any[]>(
    `/api/workstations?restaurantId=${encodeURIComponent(restId)}`,
    fetcher as any,
    {
      fallbackData: [
        { id: 'ws-kitchen', name: 'Kitchen', position: 1, restaurantId: restId },
        { id: 'ws-beverages', name: 'Beverages Counter', position: 2, restaurantId: restId },
        { id: 'ws-ready', name: 'Ready', position: 3, restaurantId: restId }
      ],
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const { data: orders = [], mutate: mutateOrders } = useSWR<Order[]>(
    `/api/orders?restaurantId=${encodeURIComponent(restId)}`,
    fetcher as any,
    {
      fallbackData: [],
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const { data: paymentMethods = [], mutate: mutatePayments } = useSWR<any[]>(
    `/api/payments?restaurantId=${encodeURIComponent(restId)}`,
    fetcher as any,
    {
      fallbackData: [
        { id: 'pay-cash', type: 'cash', name: 'Cash', enabled: true, restaurantId: restId },
        { id: 'pay-card', type: 'card', name: 'Card / UPI', enabled: true, restaurantId: restId }
      ],
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  // Zustand store
  const {
    items: currentOrderItems,
    table: currentOrderTable,
    notes: currentOrderNotes,
    orderType: currentOrderType,
    deliveryInfo: currentOrderDeliveryInfo,
    setTable: currentOrderSetTable,
    setNotes: currentOrderSetNotes,
    setOrderType: currentOrderSetOrderType,
    setDeliveryInfo: currentOrderSetDeliveryInfo,
    addItem: currentOrderAddItem,
    updateItem: currentOrderUpdateItem,
    removeItem: currentOrderRemoveItem,
    clearOrder: currentOrderClearOrder,
    updateItemQuantity: currentOrderUpdateItemQuantity
  } = useCurrentOrderStore();

  // Computed values from Zustand
  const { subtotal, tax, total } = useCurrentOrderTotals();
  const itemCountByCategory = useCurrentOrderItemCountByCategory();

  // Verificar autenticación al montar
  useEffect(() => {
    const storedUser = localStorage.getItem('chefcito-user');
    if (!storedUser) {
      console.log('[POS] No hay usuario autenticado, redirigiendo a /login');
      router.push('/login');
    }
  }, [router]);

  // Si no hay usuario, mostrar loading
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Check for editOrder parameter and load the order
  useEffect(() => {
    const editOrderId = searchParams?.get('editOrder');
    if (editOrderId && orders && orders.length > 0) {
      const orderToEdit = orders.find(order => order.id === parseInt(editOrderId));
      if (orderToEdit) {
        handleEditOrder(orderToEdit);
        setIsEditingOrder(orderToEdit);
        setIsCartOpen(true); // Automatically open the cart when editing an order
        
        // Remove the query parameter from the URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('editOrder');
        router.replace(`/pos?${newSearchParams.toString()}`, { scroll: false });
      }
    }
 }, [searchParams, orders]);
  
  // Combine loading states - 0ms instant render
  const loading = false;
  
  // Make sure we have default values
  const safeMenuItems = menuItems || [];
  const safeCategories = categories || [];
  const safePaymentMethods = paymentMethods || [];
  const safeWorkstations = workstations || [];
  
  // Fetch all data function for refresh
  const fetchAllData = useCallback(() => {
    // Individual hooks handle their own data fetching
  }, []);

  // If you need to add an order with SWR
  const addOrder = async (order: Order) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add order');
      }
      
      // SWR will automatically revalidate and update the orders list
      mutateOrders();
      return await response.json();
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  };

  const handleEditOrder = (order: Order) => {
    // Clear current order first
    currentOrderClearOrder();
    
    // Add each item from the selected order to the current order
    order.items.forEach(item => {
      const orderItem: any = {
        ...item,
        id: `${Date.now()}-${Math.random()}`, // Generate new ID for the order item
        menuItemId: item.menuItem.id,
      };
      currentOrderAddItem(orderItem, item.quantity, item.selectedExtras || [], item.notes, item.workstationId);
    });
    
    // Set other order properties
    if (order.orderType === 'delivery' && order.deliveryInfo) {
      currentOrderSetDeliveryInfo(order.deliveryInfo);
    }
    currentOrderSetOrderType(order.orderType);
    currentOrderSetTable(order.table);
    currentOrderSetNotes(order.notes || '');
  };

  const handleUpdateEditedOrder = async () => {
    if (!isEditingOrder) return;
    
    try {
      // Prepare updated order data
      const updatedOrderData = {
        table: currentOrderTable,
        items: currentOrderItems,
        notes: currentOrderNotes,
        orderType: currentOrderType,
        deliveryInfo: currentOrderType === 'delivery' ? currentOrderDeliveryInfo : undefined,
        restaurantId: user?.restaurantId || '', // Use authenticated user's restaurantId
      };
      
      const response = await fetch(`/api/orders/${isEditingOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedOrderData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order');
      }
      
      // Refresh the orders list
      mutateOrders();
      
      // Clear editing state
      setIsEditingOrder(null);
      
      // Clear current order
      currentOrderClearOrder();
      
      toast.success(t('orders.toast.updated'), {
        description: t('orders.toast.updated_desc'),
        duration: 3000,
      });
    } catch (error: any) {
      toast.error(t('toast.error'), {
        description: error.message || t('orders.toast.update_error'),
        duration: 3000,
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditingOrder(null);
    currentOrderClearOrder();
    
    toast.info(t('orders.toast.edit_cancelled'), {
      duration: 3000,
    });
  };

  const handleAddItemToOrder = (item: MenuItem) => {
    // Always open dialog to allow workstation assignment for all items
    const newItem: OrderItem = {
        id: `${item.id}-${Date.now()}`,
        menuItem: item,
        quantity: 1,
        status: 'new',
        selectedExtras: [],
        notes: '',
        workstationId: undefined
    };
    setEditingOrderItem(newItem);
  };

  const handleEditItem = (orderItem: OrderItem) => {
    setEditingOrderItem(orderItem);
  };

  const handleUpdateItemInOrder = (item: OrderItem, quantity: number, selectedExtras: MenuItem[], notes: string, workstationId?: string) => {
     currentOrderUpdateItem(item.id, quantity, selectedExtras, notes, workstationId);
     toast.success(t('pos.toast.item_updated', { item: item.menuItem.name }), { duration: 3000 });
     setEditingOrderItem(null);
  }
  
  const handleSaveNewItem = (quantity: number, selectedExtras: MenuItem[], notes: string, workstationId?: string) => {
    if (editingOrderItem) {
      currentOrderAddItem(editingOrderItem.menuItem, quantity, selectedExtras, notes, workstationId);
      setEditingOrderItem(null);
    }
  }

  const handleSendToKitchen = async () => {
    if (currentOrderItems.length === 0) {
      toast.error(t('pos.toast.empty_order_title'), {
        description: t('pos.toast.empty_order_desc'),
        duration: 3000,
      });
      return;
    }

    // Prevent double submission
    if (isSendingToKitchen) {
      return;
    }

    try {
      setIsSendingToKitchen(true);
      
      // Get the first workstation (if available)
      const workstationsUrl = user?.restaurantId ? `/api/workstations?restaurantId=${encodeURIComponent(user.restaurantId)}` : '/api/workstations';
      const workstations = await fetch(workstationsUrl).then(res => res.json());
      const firstWorkstation = workstations.data?.length > 0 ? workstations.data[0] : null;
      
      // Split quantity-based items into individual units for KDS tracking
      const expandedItems: Array<{ 
        id: string; 
        menuItemId: string; 
        name: string; 
        price: number; 
        quantity: number; 
        selectedExtraIds: string[]; 
        notes: string; 
        status: string; 
        workstationId: string | null; 
        originalItemId: string; 
        unitNumber: number; 
        totalUnits: number 
      }> = [];
      currentOrderItems.forEach((item: OrderItem) => {
        // Create individual units for each quantity
        for (let i = 0; i < item.quantity; i++) {
          expandedItems.push({
            id: `${item.id}-unit-${i + 1}`,
            menuItemId: item.menuItem.id,
            name: item.menuItem.name,
            price: item.menuItem.price,
            quantity: 1, // Each unit has quantity 1
            selectedExtraIds: item.selectedExtras?.map((extra: any) => extra.id) || [],
            notes: item.notes || '',
            // Initialize status for KDS tracking
            status: 'new',
            workstationId: item.workstationId || (firstWorkstation ? firstWorkstation.id : null),
            // Store original grouping info for stacking display
            originalItemId: item.id,
            unitNumber: i + 1,
            totalUnits: item.quantity
          });
        }
      });

      // Prepare order data based on order type
      const orderData: any = {
        restaurantId: user?.restaurantId || '',
        table: currentOrderTable,
        items: expandedItems,
        notes: currentOrderNotes,
        orderType: currentOrderType,
        createdAt: new Date().toISOString(),
        status: 'pending',
        staffName: 'POS Terminal'
      };

      console.log('Sending order to kitchen:', orderData);

      // Only include deliveryInfo for delivery orders
      if (currentOrderType === 'delivery' && currentOrderDeliveryInfo) {
        orderData.deliveryInfo = currentOrderDeliveryInfo;
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send order to kitchen');
      }
      
      toast.success(t('pos.toast.order_sent_title'), {
        description: t('pos.toast.order_sent_desc'),
        duration: 3000,
      });
      currentOrderClearOrder();
      mutateOrders(); // Refresh orders list
    } catch (error: any) {
       toast.error(t('toast.error'), {
        description: error.message || t('pos.toast.send_error'),
        duration: 5000,
      });
    } finally {
      setIsSendingToKitchen(false);
    }
  };

  const handleOpenPaymentDialog = () => {
    if (currentOrderItems.length === 0) {
      toast.error(t('pos.toast.empty_order_title'), {
        description: t('pos.toast.empty_order_payment_desc'),
        duration: 3000,
      });
      return;
    }
    setPaymentSheetOpen(true);
  }

  const handlePaymentSuccess = async () => {
    setPaymentSheetOpen(false);
    
    // Prevent double submission
    if (isProcessingPayment) {
      return;
    }
    
    // Send order as completed
    try {
      setIsProcessingPayment(true);
      
      // Get the first workstation (if available)
      const workstationsUrl = user?.restaurantId ? `/api/workstations?restaurantId=${encodeURIComponent(user.restaurantId)}` : '/api/workstations';
      const workstations = await fetch(workstationsUrl).then(res => res.json());
      const firstWorkstation = workstations.data?.length > 0 ? workstations.data[0] : null;
      
      // Prepare order data based on order type
      const orderData: any = {
        restaurantId: user?.restaurantId || '',
        table: currentOrderTable,
        items: currentOrderItems.map((item: OrderItem) => ({
          id: item.id,
          menuItemId: item.menuItem.id,
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity,
          selectedExtraIds: item.selectedExtras?.map((extra: any) => extra.id) || [],
          notes: item.notes || '',
          // For completed orders, mark all as served
          status: 'served',
          workstationId: item.workstationId || (firstWorkstation ? firstWorkstation.id : null)
        })),
        notes: currentOrderNotes,
        orderType: currentOrderType,
        status: 'completed',
        createdAt: new Date().toISOString(),
        staffName: 'POS Terminal'
      };

      // Only include deliveryInfo for delivery orders
      if (currentOrderType === 'delivery' && currentOrderDeliveryInfo) {
        orderData.deliveryInfo = currentOrderDeliveryInfo;
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to process payment');
      }

      toast.success(t('pos.toast.payment_success_title'), {
        description: t('pos.toast.payment_success_desc'),
        duration: 3000,
      });
      currentOrderClearOrder();
      mutateOrders(); // Refresh orders list
    } catch (error: any) {
      toast.error(t('toast.error'), {
        description: error.message || t('pos.toast.send_error'),
        duration: 3000,
      });
    } finally {
      setIsProcessingPayment(false);
    }
  }

  const displayCategories = Array.isArray(categories) ? categories.filter(c => !c.isModifierGroup) : [];
  const displayItems = Array.isArray(categories) && Array.isArray(menuItems) 
    ? menuItems.filter(i => !categories.find(c => c.name === i.category)?.isModifierGroup)
    : [];
  
  const isExistingItem = editingOrderItem ? 
    // We need to access the items from the currentOrder hook
    currentOrderItems.some((i: OrderItem) => i.id === editingOrderItem.id) : false;
  const isDialog = !!editingOrderItem;
  const dialogItem = editingOrderItem?.menuItem;
  
  const closeDialog = () => {
    setEditingOrderItem(null);
  }

  const handleDialogSave = (quantity: number, selectedExtras: MenuItem[], notes: string, workstationId?: string) => {
    if (isDialog && editingOrderItem) {
      if (isExistingItem) {
        handleUpdateItemInOrder(editingOrderItem, quantity, selectedExtras, notes, workstationId);
      } else {
        handleSaveNewItem(quantity, selectedExtras, notes, workstationId);
      }
    }
  }

  // Create a currentOrder object that mimics the hook's return value for compatibility
  const currentOrder = {
    items: currentOrderItems,
    table: currentOrderTable,
    setTable: (value: any) => {
      if (typeof value === 'function') {
        // Handle React's setState function form
        const newValue = value(currentOrderTable);
        currentOrderSetTable(newValue);
      } else {
        // Handle direct value
        currentOrderSetTable(value);
      }
    },
    notes: currentOrderNotes,
    setNotes: (value: any) => {
      if (typeof value === 'function') {
        // Handle React's setState function form
        const newValue = value(currentOrderNotes);
        currentOrderSetNotes(newValue);
      } else {
        // Handle direct value
        currentOrderSetNotes(value);
      }
    },
    orderType: currentOrderType,
    setOrderType: (value: any) => {
      if (typeof value === 'function') {
        // Handle React's setState function form
        const newValue = value(currentOrderType);
        currentOrderSetOrderType(newValue);
      } else {
        // Handle direct value
        currentOrderSetOrderType(value);
      }
    },
    deliveryInfo: currentOrderDeliveryInfo,
    setDeliveryInfo: (value: any) => {
      if (typeof value === 'function') {
        // Handle React's setState function form
        const newValue = value(currentOrderDeliveryInfo);
        currentOrderSetDeliveryInfo(newValue);
      } else {
        // Handle direct value
        currentOrderSetDeliveryInfo(value);
      }
    },
    addItem: currentOrderAddItem,
    updateItem: currentOrderUpdateItem,
    removeItem: currentOrderRemoveItem,
    clearOrder: currentOrderClearOrder,
    updateItemQuantity: currentOrderUpdateItemQuantity,
    subtotal,
    tax,
    total,
    itemCountByCategory
  };

  return (
    <>
      {isDialog && dialogItem && (
        <AddItemDialog
          isOpen={isDialog}
          onOpenChange={(open) => !open && closeDialog()}
          item={dialogItem}
          orderItem={isExistingItem ? editingOrderItem : null}
          onSave={handleDialogSave}
          onRemove={currentOrderRemoveItem}
          menuItems={safeMenuItems}
          categories={safeCategories}
          workstations={safeWorkstations}
        />
      )}
      
      <PaymentDialogRefactored
        isOpen={isPaymentSheetOpen}
        onOpenChange={setPaymentSheetOpen}
        orderItems={currentOrderItems}
        totalAmount={total}
        onConfirmPayment={handlePaymentSuccess}
        paymentMethods={safePaymentMethods}
      />
      
      <OrderDetailsDialog 
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        order={selectedOrder}
        onViewReceipt={() => {}}
      />
      
      <ReceiptDialog
        isOpen={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        order={selectedOrder}
      />
        
      <div className="flex flex-1 flex-col gap-4 p-1 md:p-1 overflow-hidden md:pt-1 pt-1">
        {/* Order History Button */}
        <div className="flex justify-end">
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm" 
            onClick={() => { 
              console.log('Navigating to orders page');
              router.push('/orders');
            }}
          >
            <History className="h-5 w-5" />
            <span className="ml-2">Orders</span>
          </Button>
        </div>
        
        {/* Menu Items Section */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <MenuSelection 
              menuItems={displayItems}
              categories={displayCategories}
              onAddItem={handleAddItemToOrder}
            />
          </div>
          
          {/* Persistent Cart Column - Made wider for better visibility on all screens */}
          <div className={`flex flex-col h-full transition-all duration-300 ${isCartOpen ? 'w-full md:w-96 lg:w-[32rem] ml-1' : 'w-0 opacity-0'}`}>
            <div className={`flex-1 ${isCartOpen ? 'block' : 'hidden'}`}>
              <SheetCart 
                open={true}
                onOpenChange={setIsCartOpen}
                onSendToKitchen={isEditingOrder ? handleUpdateEditedOrder : handleSendToKitchen}
                onPayment={handleOpenPaymentDialog}
                onEditItem={handleEditItem}
                isEditingOrder={!!isEditingOrder}
              />
            </div>
          </div>
        </div>
        
        {/* Cart Toggle Button - Only show when cart is hidden */}
        {!isCartOpen && (
          <div className="fixed bottom-20 right-6 z-20">
            <Button 
              size="icon" 
              className="rounded-full shadow-xl h-14 w-14 bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary-foreground/20"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="h-6 w-6" />
              {currentOrderItems.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs rounded-full bg-accent text-accent-foreground font-bold border border-background">
                  {currentOrderItems.length}
                </Badge>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

export default function PosPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PosPageContent />
    </Suspense>
  );
}