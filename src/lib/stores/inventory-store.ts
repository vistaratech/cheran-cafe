import { create } from 'zustand';
import { InventoryItem } from '@/lib/types';
import { buildApiUrl } from '@/lib/helpers';

interface InventoryEntities {
  inventoryItems: Record<string, InventoryItem>;
}

interface InventoryState {
  entities: InventoryEntities;
  loading: boolean;
  error: string | null;
  // Form state
  form: {
    name: string;
    quantity: string;
    unit: string;
    reorderThreshold: string;
    category: string;
    linkedItemIds: string[];
  };
}

interface InventoryActions {
  fetchInventoryItems: (restaurantId?: string) => Promise<void>;
  addInventoryItem: (itemData: Omit<InventoryItem, 'id' | 'lastRestocked'>) => Promise<InventoryItem>;
  updateInventoryItem: (id: string, itemData: Partial<InventoryItem>) => Promise<InventoryItem>;
  deleteInventoryItem: (id: string) => Promise<void>;
  adjustStock: (itemId: string, adjustment: number) => Promise<void>;
  clearError: () => void;
  // Form state actions
  setFormName: (name: string) => void;
  setFormQuantity: (quantity: string) => void;
  setFormUnit: (unit: string) => void;
  setFormReorderThreshold: (reorderThreshold: string) => void;
  setFormCategory: (category: string) => void;
  setFormLinkedItemIds: (linkedItemIds: string[]) => void;
  resetForm: (item?: InventoryItem | null) => void;
  clearForm: () => void;
  getIsFormValid: () => boolean;
  getFormErrors: () => string[];
}

interface InventorySelectors {
  getInventoryItems: () => InventoryItem[];
  getInventoryItemById: (id: string) => InventoryItem | undefined;
  getFilteredInventoryItems: (filterFn: (item: InventoryItem) => boolean) => InventoryItem[];
  getLowStockItems: () => InventoryItem[];
  getOutOfStockItems: () => InventoryItem[];
  getInventoryCategories: () => string[];
  // Form state selectors
  getFormName: () => string;
  getFormQuantity: () => string;
  getFormUnit: () => string;
  getFormReorderThreshold: () => string;
  getFormCategory: () => string;
  getFormLinkedItemIds: () => string[];
}

type InventoryStore = InventoryState & InventoryActions & InventorySelectors;

const initialState: InventoryState = {
  entities: {
    inventoryItems: {}
  },
  loading: false,
  error: null,
  form: {
    name: '',
    quantity: '',
    unit: '',
    reorderThreshold: '',
    category: '',
    linkedItemIds: []
  }
};

export const useInventoryStore = create<InventoryStore>()((set, get) => ({
  ...initialState,

  // Actions
  fetchInventoryItems: async (restaurantId?: string) => {
    set({ loading: true, error: null });
    try {
      const url = buildApiUrl('/api/inventory', restaurantId);
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        const inventoryItems: Record<string, InventoryItem> = {};
        result.data.forEach((item: InventoryItem) => {
          inventoryItems[item.id] = item;
        });
        
        set({
          entities: {
            ...get().entities,
            inventoryItems
          },
          loading: false
        });
      } else {
        set({
          error: result.error || 'Failed to fetch inventory items',
          loading: false
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        loading: false
      });
    }
  },

  addInventoryItem: async (itemData) => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        const newItem = result.data;
        set((state) => ({
          entities: {
            ...state.entities,
            inventoryItems: {
              ...state.entities.inventoryItems,
              [newItem.id]: newItem
            }
          }
        }));
        return newItem;
      } else {
        throw new Error(result.error || 'Failed to add inventory item');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add inventory item';
      set({ error: errorMessage });
      throw error;
    }
  },

  updateInventoryItem: async (id, itemData) => {
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: itemData }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        const updatedItem = result.data;
        set((state) => ({
          entities: {
            ...state.entities,
            inventoryItems: {
              ...state.entities.inventoryItems,
              [id]: updatedItem
            }
          }
        }));
        return updatedItem;
      } else {
        throw new Error(result.error || 'Failed to update inventory item');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update inventory item';
      set({ error: errorMessage });
      throw error;
    }
  },

  deleteInventoryItem: async (id) => {
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        set((state) => {
          const newInventoryItems = { ...state.entities.inventoryItems };
          delete newInventoryItems[id];
          return {
            entities: {
              ...state.entities,
              inventoryItems: newInventoryItems
            }
          };
        });
      } else {
        throw new Error(result.error || 'Failed to delete inventory item');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete inventory item';
      set({ error: errorMessage });
      throw error;
    }
  },

  adjustStock: async (itemId, adjustment) => {
    try {
      const response = await fetch(`/api/inventory/${itemId}/adjust-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adjustment }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        const updatedItem = result.data;
        set((state) => ({
          entities: {
            ...state.entities,
            inventoryItems: {
              ...state.entities.inventoryItems,
              [itemId]: updatedItem
            }
          }
        }));
      } else {
        throw new Error(result.error || 'Failed to adjust stock');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to adjust stock';
      set({ error: errorMessage });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  // Form actions
  setFormName: (name) => {
    set((state) => ({
      form: {
        ...state.form,
        name
      }
    }));
  },

  setFormQuantity: (quantity) => {
    set((state) => ({
      form: {
        ...state.form,
        quantity
      }
    }));
  },

  setFormUnit: (unit) => {
    set((state) => ({
      form: {
        ...state.form,
        unit
      }
    }));
  },

  setFormReorderThreshold: (reorderThreshold) => {
    set((state) => ({
      form: {
        ...state.form,
        reorderThreshold
      }
    }));
  },

  setFormCategory: (category) => {
    set((state) => ({
      form: {
        ...state.form,
        category
      }
    }));
  },

  setFormLinkedItemIds: (linkedItemIds) => {
    set((state) => ({
      form: {
        ...state.form,
        linkedItemIds
      }
    }));
  },

  resetForm: (item = null) => {
    set({
      form: {
        name: item?.name || '',
        quantity: item?.quantity?.toString() || '',
        unit: item?.unit || '',
        reorderThreshold: item?.reorderThreshold?.toString() || '',
        category: item?.category || '',
        linkedItemIds: item?.linkedItemIds || []
      }
    });
  },

  clearForm: () => {
    set({
      form: {
        name: '',
        quantity: '',
        unit: '',
        reorderThreshold: '',
        category: '',
        linkedItemIds: []
      }
    });
  },

  getIsFormValid: () => {
    const { form } = get();
    const quantityNum = parseFloat(form.quantity);
    const thresholdNum = parseFloat(form.reorderThreshold);
    
    return form.name.trim() !== '' &&
           form.quantity !== '' &&
           !isNaN(quantityNum) &&
           form.reorderThreshold !== '' &&
           !isNaN(thresholdNum);
  },

  getFormErrors: () => {
    const { form } = get();
    const errors: string[] = [];
    
    if (!form.name.trim()) {
      errors.push('Name is required');
    }
    
    if (form.quantity === '') {
      errors.push('Quantity is required');
    } else {
      const quantityNum = parseFloat(form.quantity);
      if (isNaN(quantityNum)) {
        errors.push('Invalid quantity');
      }
    }
    
    if (form.reorderThreshold === '') {
      errors.push('Reorder threshold is required');
    } else {
      const thresholdNum = parseFloat(form.reorderThreshold);
      if (isNaN(thresholdNum)) {
        errors.push('Invalid reorder threshold');
      }
    }
    
    return errors;
  },

  // Selectors
  getInventoryItems: () => {
    const { entities } = get();
    return Object.values(entities.inventoryItems);
  },

  getInventoryItemById: (id) => {
    const { entities } = get();
    return entities.inventoryItems[id];
  },

  getFilteredInventoryItems: (filterFn) => {
    const { entities } = get();
    return Object.values(entities.inventoryItems).filter(filterFn);
  },

  getLowStockItems: () => {
    const { entities } = get();
    return Object.values(entities.inventoryItems).filter(
      item => item.quantity > 0 && item.quantity < item.reorderThreshold
    );
  },

  getOutOfStockItems: () => {
    const { entities } = get();
    return Object.values(entities.inventoryItems).filter(
      item => item.quantity <= 0
    );
  },

  getInventoryCategories: () => {
    const { entities } = get();
    const categories = new Set(
      Object.values(entities.inventoryItems)
        .map(item => item.category)
        .filter(Boolean) as string[]
    );
    return Array.from(categories).sort();
  },

  // Form selectors
  getFormName: () => get().form.name,
  getFormQuantity: () => get().form.quantity,
  getFormUnit: () => get().form.unit,
  getFormReorderThreshold: () => get().form.reorderThreshold,
  getFormCategory: () => get().form.category,
  getFormLinkedItemIds: () => get().form.linkedItemIds
}));