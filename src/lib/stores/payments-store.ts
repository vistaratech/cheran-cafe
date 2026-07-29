import { create } from 'zustand';
import { Payment } from '@/lib/types';
import { buildApiUrl } from '@/lib/helpers';

interface PaymentEntities {
  paymentMethods: Record<string, Payment>;
}

interface PaymentState {
  entities: PaymentEntities;
  loading: boolean;
  error: string | null;
  // Form state
  form: {
    name: string;
    type: 'cash' | 'card' | 'bank_transfer';
    banks: string[];
    newBank: string;
  };
}

interface PaymentActions {
  fetchPaymentMethods: (restaurantId?: string) => Promise<void>;
  addPaymentMethod: (methodData: Omit<Payment, 'id'>) => Promise<Payment>;
  updatePaymentMethod: (id: string, methodData: Partial<Payment>) => Promise<Payment>;
  deletePaymentMethod: (id: string) => Promise<void>;
  clearError: () => void;
  // Form state actions
  setFormName: (name: string) => void;
  setFormType: (type: 'cash' | 'card' | 'bank_transfer') => void;
  setFormBanks: (banks: string[]) => void;
  setFormNewBank: (newBank: string) => void;
  resetForm: (method?: Payment | null) => void;
  clearForm: () => void;
  addBank: (bank: string) => void;
  deleteBank: (bank: string) => void;
}

interface PaymentSelectors {
  getPaymentMethods: () => Payment[];
  getPaymentMethodById: (id: string) => Payment | undefined;
  getPaymentMethodsByType: (type: Payment['type']) => Payment[];
  getCashMethods: () => Payment[];
  getCardMethods: () => Payment[];
  getBankTransferMethods: () => Payment[];
  getAllBanks: () => string[];
  // Form state selectors
  getFormName: () => string;
  getFormType: () => 'cash' | 'card' | 'bank_transfer';
  getFormBanks: () => string[];
  getFormNewBank: () => string;
  getIsFormValid: () => boolean;
}

type PaymentStore = PaymentState & PaymentActions & PaymentSelectors;

const initialState: PaymentState = {
  entities: {
    paymentMethods: {}
  },
  loading: false,
  error: null,
  form: {
    name: '',
    type: 'card',
    banks: [],
    newBank: ''
  }
};

export const usePaymentsStore = create<PaymentStore>()((set, get) => ({
  ...initialState,

  // Actions
  fetchPaymentMethods: async (restaurantId?: string) => {
    set({ loading: true, error: null });
    try {
      const url = buildApiUrl('/api/payments', restaurantId);
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        const paymentMethods: Record<string, Payment> = {};
        result.data.forEach((method: Payment) => {
          paymentMethods[method.id] = method;
        });
        
        set({
          entities: {
            ...get().entities,
            paymentMethods
          },
          loading: false
        });
      } else {
        set({
          error: result.error || 'Failed to fetch payment methods',
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

  addPaymentMethod: async (methodData) => {
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(methodData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        const newMethod = result.data;
        set((state) => ({
          entities: {
            ...state.entities,
            paymentMethods: {
              ...state.entities.paymentMethods,
              [newMethod.id]: newMethod
            }
          }
        }));
        return newMethod;
      } else {
        throw new Error(result.error || 'Failed to add payment method');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add payment method';
      set({ error: errorMessage });
      throw error;
    }
  },

  updatePaymentMethod: async (id, methodData) => {
    try {
      const response = await fetch(`/api/payments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(methodData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        const updatedMethod = result.data;
        set((state) => ({
          entities: {
            ...state.entities,
            paymentMethods: {
              ...state.entities.paymentMethods,
              [id]: updatedMethod
            }
          }
        }));
        return updatedMethod;
      } else {
        throw new Error(result.error || 'Failed to update payment method');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment method';
      set({ error: errorMessage });
      throw error;
    }
  },

  deletePaymentMethod: async (id) => {
    try {
      const response = await fetch(`/api/payments/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        set((state) => {
          const newPaymentMethods = { ...state.entities.paymentMethods };
          delete newPaymentMethods[id];
          return {
            entities: {
              ...state.entities,
              paymentMethods: newPaymentMethods
            }
          };
        });
      } else {
        throw new Error(result.error || 'Failed to delete payment method');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete payment method';
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

  setFormType: (type) => {
    set((state) => ({
      form: {
        ...state.form,
        type
      }
    }));
  },

  setFormBanks: (banks) => {
    set((state) => ({
      form: {
        ...state.form,
        banks
      }
    }));
  },

  setFormNewBank: (newBank) => {
    set((state) => ({
      form: {
        ...state.form,
        newBank
      }
    }));
  },

  resetForm: (method = null) => {
    set({
      form: {
        name: method?.name || '',
        type: method?.type || 'card',
        banks: method?.banks || [],
        newBank: ''
      }
    });
  },

  clearForm: () => {
    set({
      form: {
        name: '',
        type: 'card',
        banks: [],
        newBank: ''
      }
    });
  },

  addBank: (bank) => {
    set((state) => {
      if (bank.trim() && !state.form.banks.includes(bank.trim())) {
        return {
          form: {
            ...state.form,
            banks: [...state.form.banks, bank.trim()],
            newBank: ''
          }
        };
      }
      return state;
    });
  },

  deleteBank: (bankToDelete) => {
    set((state) => ({
      form: {
        ...state.form,
        banks: state.form.banks.filter(bank => bank !== bankToDelete)
      }
    }));
  },

  // Selectors
  getPaymentMethods: () => {
    const { entities } = get();
    return Object.values(entities.paymentMethods);
  },

  getPaymentMethodById: (id) => {
    const { entities } = get();
    return entities.paymentMethods[id];
  },

  getPaymentMethodsByType: (type) => {
    const { entities } = get();
    return Object.values(entities.paymentMethods).filter(
      method => method.type === type
    );
  },

  getCashMethods: () => {
    return get().getPaymentMethodsByType('cash');
  },

  getCardMethods: () => {
    return get().getPaymentMethodsByType('card');
  },

  getBankTransferMethods: () => {
    return get().getPaymentMethodsByType('bank_transfer');
  },

  getAllBanks: () => {
    const { entities } = get();
    const allBanks = new Set<string>();
    
    Object.values(entities.paymentMethods).forEach(method => {
      if (method.banks && Array.isArray(method.banks)) {
        method.banks.forEach(bank => allBanks.add(bank));
      }
    });
    
    return Array.from(allBanks).sort();
  },

  // Form selectors
  getFormName: () => get().form.name,
  getFormType: () => get().form.type,
  getFormBanks: () => get().form.banks,
  getFormNewBank: () => get().form.newBank,
  getIsFormValid: () => {
    const { form } = get();
    return form.name.trim() !== '';
  }
}));