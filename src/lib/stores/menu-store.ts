import { create } from 'zustand';
import { type MenuItem, type Category } from '@/lib/types';
import { toast } from 'sonner';
import { buildApiUrl } from '@/lib/helpers';

// Define normalized entities
interface NormalizedEntities {
  menuItems: Record<string, MenuItem>;
  categories: Record<number, Category>;
}

interface NormalizedState {
  entities: NormalizedEntities;
}

interface NormalizedMenuState extends NormalizedState {
  loading: boolean;
  error: string | null;
  
  // Form state
  form: {
    name: string;
    price: string;
    description: string;
    category: string;
    imageUrl: string;
    linkedModifiers: string[];
  };
  
  // Menu item actions
  addMenuItem: (itemData: Omit<MenuItem, 'id'>) => Promise<MenuItem | null>;
  updateMenuItem: (id: string, itemData: Partial<MenuItem>) => Promise<boolean>;
  deleteMenuItem: (id: string) => Promise<boolean>;
  
  // Category actions
  addCategory: (categoryData: Omit<Category, 'id'>, restaurantId?: string) => Promise<Category | null>;
  updateCategory: (id: number, categoryData: Partial<Category>, restaurantId?: string) => Promise<boolean>;
  deleteCategory: (id: number, restaurantId?: string) => Promise<boolean>;
  isCategoryInUse: (id: number) => Promise<boolean>;
  
  // Data fetching
  fetchMenuData: (restaurantId?: string) => Promise<void>;
  
  // Form actions
  setFormName: (name: string) => void;
  setFormPrice: (price: string) => void;
  setFormDescription: (description: string) => void;
  setFormCategory: (category: string) => void;
  setFormImageUrl: (imageUrl: string) => void;
  setFormLinkedModifiers: (linkedModifiers: string[]) => void;
  resetForm: (item?: MenuItem | null) => void;
  clearForm: () => void;
  getIsFormValid: () => boolean;
  getFormErrors: () => string[];
  
  // Selector helpers
  getMenuItems: () => MenuItem[];
  getCategories: () => Category[];
  
  // Form selectors
  getFormName: () => string;
  getFormPrice: () => string;
  getFormDescription: () => string;
  getFormCategory: () => string;
  getFormImageUrl: () => string;
  getFormLinkedModifiers: () => string[];
}

// Initial state
const initialState: NormalizedState = {
  entities: {
    menuItems: {},
    categories: {}
  }
};

export const useMenuStore = create<NormalizedMenuState>()((set, get) => ({
  ...initialState,
  loading: false,
  error: null,
  form: {
    name: '',
    price: '',
    description: '',
    category: '',
    imageUrl: '',
    linkedModifiers: []
  },
  
  addMenuItem: async (itemData) => {
    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'addMenuItem', data: itemData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add menu item');
      }
      
      const newItem = await response.json();
      set((state) => ({
        entities: {
          ...state.entities,
          menuItems: {
            ...state.entities.menuItems,
            [newItem.id]: newItem
          }
        }
      }));
      
      toast.success('Menu item added successfully');
      return newItem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add menu item';
      toast.error('Error', {
        description: errorMessage,
        duration: 3000,
      });
      set({ error: errorMessage });
      return null;
    }
  },
  
  updateMenuItem: async (id, itemData) => {
    try {
      const response = await fetch('/api/menu', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'updateMenuItem', id, data: itemData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update menu item');
      }
      
      const updatedItem = await response.json();
      set((state) => ({
        entities: {
          ...state.entities,
          menuItems: {
            ...state.entities.menuItems,
            [id]: updatedItem
          }
        }
      }));
      
      toast.success('Menu item updated successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update menu item';
      toast.error('Error', {
        description: errorMessage,
        duration: 3000,
      });
      set({ error: errorMessage });
      return false;
    }
  },
  
  deleteMenuItem: async (id) => {
    try {
      const response = await fetch('/api/menu', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'deleteMenuItem', id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete menu item');
      }
      
      set((state) => {
        const newMenuItems = { ...state.entities.menuItems };
        delete newMenuItems[id];
        
        return {
          entities: {
            ...state.entities,
            menuItems: newMenuItems
          }
        };
      });
      
      toast.success('Menu item deleted successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete menu item';
      toast.error('Error', {
        description: errorMessage,
        duration: 3000,
      });
      set({ error: errorMessage });
      return false;
    }
  },
  
  addCategory: async (categoryData, restaurantId?) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'addCategory', data: { ...categoryData, restaurantId } }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add category');
      }
      
      const newCategory = await response.json();
      set((state) => ({
        entities: {
          ...state.entities,
          categories: {
            ...state.entities.categories,
            [newCategory.id]: newCategory
          }
        }
      }));
      
      toast.success('Category added successfully');
      return newCategory;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add category';
      toast.error('Error', {
        description: errorMessage,
        duration: 3000,
      });
      set({ error: errorMessage });
      return null;
    }
  },
  
  updateCategory: async (id, categoryData, restaurantId?) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: { ...categoryData, restaurantId } }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update category');
      }
      
      set((state) => ({
        entities: {
          ...state.entities,
          categories: {
            ...state.entities.categories,
            [id]: { 
              ...(state.entities.categories[id] || {}),
              ...categoryData 
            }
          }
        }
      }));
      
      toast.success('Category updated successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
      toast.error('Error', {
        description: errorMessage,
        duration: 3000,
      });
      set({ error: errorMessage });
      return false;
    }
  },
  
  deleteCategory: async (id, restaurantId?) => {
    try {
      const url = buildApiUrl(`/api/categories/${id}`, restaurantId);
      const response = await fetch(url, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }
      
      set((state) => {
        const newCategories = { ...state.entities.categories };
        delete newCategories[id];
        
        return {
          entities: {
            ...state.entities,
            categories: newCategories
          }
        };
      });
      
      toast.success('Category deleted successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
      toast.error('Error', {
        description: errorMessage,
        duration: 3000,
      });
      set({ error: errorMessage });
      return false;
    }
  },
  
  isCategoryInUse: async (id) => {
    try {
      // This would typically be implemented on the backend
      // For now, we'll check if any menu items are using this category
      const { entities } = get();
      return Object.values(entities.menuItems).some((item) => item.category === id.toString());
    } catch (error) {
      return false;
    }
  },
  
  fetchMenuData: async (restaurantId?: string) => {
    set({ loading: true, error: null });

    try {
      const [menuItemsResponse, categoriesResponse] = await Promise.all([
        fetch(buildApiUrl('/api/menu', restaurantId)),
        fetch(buildApiUrl('/api/categories', restaurantId)),
      ]);
      const [menuItemsResult, categoriesResult] = await Promise.all([
        menuItemsResponse.json(),
        categoriesResponse.json(),
      ]);
      
      if (menuItemsResult.success && categoriesResult.success) {
        // Normalize menu items
        const menuItems: Record<string, MenuItem> = {};
        menuItemsResult.data.forEach((item: MenuItem) => {
          menuItems[item.id] = item;
        });
        
        // Normalize categories
        const categories: Record<number, Category> = {};
        categoriesResult.data.forEach((category: Category) => {
          categories[category.id] = category;
        });
        
        set({
          entities: {
            ...get().entities,
            menuItems,
            categories
          },
          loading: false,
        });
      } else {
        throw new Error(
          menuItemsResult.error || categoriesResult.error || 'Failed to fetch menu data'
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch menu data';
      toast.error('Error', {
        description: errorMessage,
        duration: 3000,
      });
      set({ error: errorMessage, loading: false });
    }
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
  
  setFormPrice: (price) => {
    set((state) => ({
      form: {
        ...state.form,
        price
      }
    }));
  },
  
  setFormDescription: (description) => {
    set((state) => ({
      form: {
        ...state.form,
        description
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
  
  setFormImageUrl: (imageUrl) => {
    set((state) => ({
      form: {
        ...state.form,
        imageUrl
      }
    }));
  },
  
  setFormLinkedModifiers: (linkedModifiers) => {
    set((state) => ({
      form: {
        ...state.form,
        linkedModifiers
      }
    }));
  },
  
  resetForm: (item = null) => {
    set({
      form: {
        name: item?.name || '',
        price: item?.price?.toString() || '',
        description: item?.description || '',
        category: item?.category || '',
        imageUrl: item?.imageUrl || '',
        linkedModifiers: item?.linkedModifiers || []
      }
    });
  },
  
  clearForm: () => {
    set({
      form: {
        name: '',
        price: '',
        description: '',
        category: '',
        imageUrl: '',
        linkedModifiers: []
      }
    });
  },
  
  getIsFormValid: () => {
    const { form } = get();
    return form.name.trim() !== '' && 
           form.price !== '' && 
           form.category !== '' &&
           !isNaN(parseFloat(form.price)) && 
           parseFloat(form.price) >= 0;
  },
  
  getFormErrors: () => {
    const { form } = get();
    const errors: string[] = [];
    
    if (!form.name.trim()) {
      errors.push('Name is required');
    }
    
    if (!form.price) {
      errors.push('Price is required');
    } else {
      const priceNum = parseFloat(form.price);
      if (isNaN(priceNum) || priceNum < 0) {
        errors.push('Invalid price');
      }
    }
    
    if (!form.category) {
      errors.push('Category is required');
    }
    
    return errors;
  },
  
  // Selector helpers
  getMenuItems: () => {
    const { entities } = get();
    return Object.values(entities.menuItems);
  },
  
  getCategories: () => {
    const { entities } = get();
    return Object.values(entities.categories);
  },
  
  // Form selectors
  getFormName: () => get().form.name,
  getFormPrice: () => get().form.price,
  getFormDescription: () => get().form.description,
  getFormCategory: () => get().form.category,
  getFormImageUrl: () => get().form.imageUrl,
  getFormLinkedModifiers: () => get().form.linkedModifiers
}));