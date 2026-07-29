import { create } from 'zustand';
import { useMemo } from 'react';
import { 
  OrderItem, 
  MenuItem, 
  OrderType, 
  DeliveryInfo
} from '@/lib/types';
import { KDS_STATES } from '@/lib/constants';
import { NormalizedState } from '@/lib/types';

// Define the store state
interface NormalizedCurrentOrderState extends NormalizedState {
  // Actions
  setItems: (items: OrderItem[]) => void;
  setTable: (table: number) => void;
  setNotes: (notes: string) => void;
  setOrderType: (orderType: OrderType) => void;
  setDeliveryInfo: (deliveryInfo: DeliveryInfo) => void;
  
  addItem: (
    itemToAdd: MenuItem, 
    quantity: number, 
    selectedExtras: MenuItem[], 
    notes?: string, 
    workstationId?: string
  ) => void;
  
  updateItem: (
    itemId: string, 
    newQuantity: number, 
    newSelectedExtras: MenuItem[], 
    notes?: string, 
    workstationId?: string
  ) => void;
  
  updateItemQuantity: (itemId: string, adjustment: number) => void;
  removeItem: (itemId: string) => void;
  clearOrder: () => void;
}

// Initial state
const initialState: NormalizedState = {
  entities: {
    orderItems: {},
    menuItems: {}
  },
  currentOrder: {
    itemIds: [],
    table: 1,
    notes: '',
    orderType: 'dine-in' as OrderType,
    deliveryInfo: {
      name: '',
      address: '',
      phone: ''
    }
  }
};

// Create a stable initial state for server-side rendering
let serverSnapshot: NormalizedState;
const getServerSnapshot = (): NormalizedState => {
  if (!serverSnapshot) {
    serverSnapshot = JSON.parse(JSON.stringify(initialState));
  }
  return serverSnapshot;
};

export const useNormalizedCurrentOrderStore = create<NormalizedCurrentOrderState>()((set, get) => ({
  ...getServerSnapshot(),
  
  setItems: (items) => set((state) => {
    // Create a copy of the state
    const newState = {...state};
    newState.currentOrder = {...newState.currentOrder};
    newState.currentOrder.itemIds = [];
    newState.entities = {...newState.entities};
    newState.entities.orderItems = {};
    
    // Add new items
    items.forEach(item => {
      newState.entities.orderItems[item.id] = item;
      newState.currentOrder.itemIds.push(item.id);
    });
    
    return newState;
  }),
  
  setTable: (table) => set((state) => ({
    ...state,
    currentOrder: {
      ...state.currentOrder,
      table
    }
  })),
  
  setNotes: (notes) => set((state) => ({
    ...state,
    currentOrder: {
      ...state.currentOrder,
      notes
    }
  })),
  
  setOrderType: (orderType) => set((state) => ({
    ...state,
    currentOrder: {
      ...state.currentOrder,
      orderType
    }
  })),
  
  setDeliveryInfo: (deliveryInfo) => set((state) => ({
    ...state,
    currentOrder: {
      ...state.currentOrder,
      deliveryInfo
    }
  })),
  
  addItem: (itemToAdd, quantity, selectedExtras, notes, workstationId) => set((state) => {
    // Create a copy of the state
    const newState = {...state};
    newState.entities = {...newState.entities};
    newState.entities.menuItems = {...newState.entities.menuItems};
    newState.entities.orderItems = {...newState.entities.orderItems};
    newState.currentOrder = {...newState.currentOrder};
    newState.currentOrder.itemIds = [...newState.currentOrder.itemIds];
    
    // First, ensure the menu item is in our entities
    if (!newState.entities.menuItems[itemToAdd.id]) {
      newState.entities.menuItems[itemToAdd.id] = itemToAdd;
    }
    
    // Check for existing item with same properties
    const existingItemKey = Object.keys(newState.entities.orderItems).find((key) => {
      const item = newState.entities.orderItems[key];
      return (
        item.menuItem.id === itemToAdd.id &&
        JSON.stringify(item.selectedExtras?.map((e: MenuItem) => e.id).sort()) === 
          JSON.stringify(selectedExtras.map((e: MenuItem) => e.id).sort()) &&
        item.notes === (notes || undefined) &&
        item.workstationId === workstationId
      );
    });
    
    if (existingItemKey) {
      // Update quantity of existing item
      const existingItem = newState.entities.orderItems[existingItemKey];
      newState.entities.orderItems[existingItemKey] = {
        ...existingItem,
        quantity: existingItem.quantity + quantity
      };
    } else {
      // Create new item
      const newItemId = `${itemToAdd.id}-${Date.now()}`;
      const newItem: OrderItem = {
        id: newItemId,
        menuItem: itemToAdd,
        quantity,
        status: KDS_STATES.NEW,
        selectedExtras,
        notes,
        workstationId: workstationId || undefined
      };
      
      newState.entities.orderItems[newItemId] = newItem;
      newState.currentOrder.itemIds.push(newItemId);
    }
    
    return newState;
  }),
  
  updateItem: (itemId, newQuantity, newSelectedExtras, notes, workstationId) => set((state) => {
    // Create a copy of the state
    const newState = {...state};
    newState.entities = {...newState.entities};
    newState.entities.orderItems = {...newState.entities.orderItems};
    newState.currentOrder = {...newState.currentOrder};
    
    if (newState.entities.orderItems[itemId]) {
      newState.entities.orderItems[itemId] = {
        ...newState.entities.orderItems[itemId],
        quantity: newQuantity,
        selectedExtras: newSelectedExtras,
        notes,
        workstationId
      };
    }
    
    return newState;
  }),
  
  updateItemQuantity: (itemId, adjustment) => set((state) => {
    // Create a copy of the state
    const newState = {...state};
    newState.entities = {...newState.entities};
    newState.entities.orderItems = {...newState.entities.orderItems};
    newState.currentOrder = {...newState.currentOrder};
    
    const item = newState.entities.orderItems[itemId];
    if (!item) return state;
    
    const newQuantity = item.quantity + adjustment;
    
    if (newQuantity <= 0) {
      // Remove item if quantity is zero or less
      delete newState.entities.orderItems[itemId];
      newState.currentOrder.itemIds = newState.currentOrder.itemIds.filter((id: string) => id !== itemId);
    } else {
      // Update quantity
      newState.entities.orderItems[itemId] = {
        ...item,
        quantity: newQuantity
      };
    }
    
    return newState;
  }),
  
  removeItem: (itemId) => set((state) => {
    // Create a copy of the state
    const newState = {...state};
    newState.entities = {...newState.entities};
    newState.entities.orderItems = {...newState.entities.orderItems};
    newState.currentOrder = {...newState.currentOrder};
    
    delete newState.entities.orderItems[itemId];
    newState.currentOrder.itemIds = newState.currentOrder.itemIds.filter((id: string) => id !== itemId);
    
    return newState;
  }),
  
  clearOrder: () => set((state) => ({
    ...state,
    entities: {
      ...state.entities,
      orderItems: {}
    },
    currentOrder: {
      ...state.currentOrder,
      itemIds: [],
      table: 1,
      notes: '',
      orderType: 'dine-in',
      deliveryInfo: { name: '', address: '', phone: '' }
    }
  }))
}));

// Selectors - these provide backward compatibility with existing components
export const useNormalizedCurrentOrderItems = () => {
  const state = useNormalizedCurrentOrderStore();
  return state.currentOrder.itemIds.map(
    id => state.entities.orderItems[id]
  );
};

// Reuse the existing selector logic from the original store to avoid duplication
export const useNormalizedCurrentOrderTotals = () => {
  const items = useNormalizedCurrentOrderItems();
  
  // Reuse the same calculation logic as in the original store
  return useMemo(() => {
    const subtotal = items.reduce((acc, item) => {
      const extrasPrice = item.selectedExtras?.reduce((extraAcc, extra) => extraAcc + extra.price, 0) || 0;
      return acc + (item.menuItem.price + extrasPrice) * item.quantity;
    }, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [items]);
};

// Reuse the existing selector logic from the original store to avoid duplication
export const useNormalizedCurrentOrderItemCountByCategory = () => {
  const items = useNormalizedCurrentOrderItems();
  
  // Reuse the same calculation logic as in the original store
  return useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const category = item.menuItem.category;
      counts[category] = (counts[category] || 0) + item.quantity;
    });
    return counts;
  }, [items]);
};

// Backward compatibility selectors - these mimic the old store's return values
export const useCurrentOrderStoreCompat = () => {
  const state = useNormalizedCurrentOrderStore();
  const items = useNormalizedCurrentOrderItems();
  const table = state.currentOrder.table;
  const notes = state.currentOrder.notes;
  const orderType = state.currentOrder.orderType;
  const deliveryInfo = state.currentOrder.deliveryInfo;
  
  const setItems = state.setItems;
  const setTable = state.setTable;
  const setNotes = state.setNotes;
  const setOrderType = state.setOrderType;
  const setDeliveryInfo = state.setDeliveryInfo;
  
  const addItem = state.addItem;
  const updateItem = state.updateItem;
  const updateItemQuantity = state.updateItemQuantity;
  const removeItem = state.removeItem;
  const clearOrder = state.clearOrder;
  
  return {
    items,
    table,
    notes,
    orderType,
    deliveryInfo,
    setItems,
    setTable,
    setNotes,
    setOrderType,
    setDeliveryInfo,
    addItem,
    updateItem,
    updateItemQuantity,
    removeItem,
    clearOrder
  };
};

// Compatibility selectors for computed values
export const useCurrentOrderTotalsCompat = () => {
  return useNormalizedCurrentOrderTotals();
};

export const useCurrentOrderItemCountByCategoryCompat = () => {
  return useNormalizedCurrentOrderItemCountByCategory();
};