export type MenuItem = {
  id: string;
  name: string;
  price: number;
  description?: string;
  available?: boolean;
  category: string;
  imageUrl: string;

  linkedModifiers?: string[]; // Names of modifier categories
  sortIndex: number;
};

export type OrderItem = {
  id:string;
  menuItem: MenuItem;
  quantity: number; // This will be the total quantity for the item line
  status: 'new' | 'in-progress' | 'ready' | 'served' | string; // Status tracking for workstation workflow
  selectedExtras?: MenuItem[];
  splitId?: number;
  notes?: string;
  workstationId?: string; // Track which workstation this item belongs to
  position?: number; // Position field for ordering items
};

export type OrderStatusUpdate = {
  status: string;
  timestamp: string;
};

export type OrderType = 'dine-in' | 'delivery';

export type DeliveryInfo = {
  name: string;
  address: string;
  phone: string;
};

export type Order = {
  id: number;
  restaurantId: string;
  items: OrderItem[];
  status: 'pending' | 'completed';
  createdAt: Date;
  completedAt?: Date;
  table: number;
  isPinned?: boolean;
  position?: number;
  customerId?: string;
  staffName?: string;
  statusHistory?: OrderStatusUpdate[];
  notes?: string;
  orderType: OrderType;
  deliveryInfo?: DeliveryInfo;
};

export type ModifierCategory = {
  id: number;
  name: string;
  parentId?: number | null;
};

export type Category = {
    id: number;
    name: string;
    isModifierGroup?: boolean;
    linkedModifiers?: string[]; // Names of modifier categories
    parentId?: number | null;
};

export interface Payment {
  id: string;
  restaurantId: string;
  name: string;
  type: 'cash' | 'card' | 'bank_transfer';
  enabled: boolean;
  banks?: string[];
}

export type BillSplit = {
  id: number;
  total: number;
}

export interface CustomerPaymentAssignment {
  customerId: string;
  customerName: string;
  paymentMethodId?: string;
  items: {
    orderItemId: string;
    quantity: number;
  }[];
  amount: number;
  status: 'pending' | 'paid' | 'partial';
}

export type Customer = {
  id: string;
  restaurantId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyaltyPoints?: number;
};

export type InventoryItem = {
  id: string;
  restaurantId: string;
  name: string;
  quantity: number;
  unit: "kg" | "g" | "L" | "ml" | "pcs" | string;
  reorderThreshold: number;
  lastRestocked: string; // ISO date string
  linkedItemIds?: string[];
  category?: string;
};

export type StaffPerformance = {
    id: string;
    name: string;
    email: string;
    role: 'Owner' | 'Admin' | 'Staff';
    status: 'On Shift' | 'Off Shift' | 'On Break';
    tablesServed: number;
    totalSales: number;
    avgSaleValue: number;
};

export type ReadyItem = {
  id: string;
  name: string;
  orderId: number;
  table: number;
  orderItemId: string;
  selectedExtras?: MenuItem[];
  notes?: string;
};

// Normalized entity types for current order store
export interface Entities {
  orderItems: Record<string, OrderItem>;
  menuItems: Record<string, MenuItem>;
}

// IDs for relationships
export type EntityId = string;

// Normalized state structure
export interface NormalizedState {
  entities: Entities;
  // Current order state
  currentOrder: {
    itemIds: EntityId[];
    table: number;
    notes: string;
    orderType: OrderType;
    deliveryInfo: DeliveryInfo;
  };
}