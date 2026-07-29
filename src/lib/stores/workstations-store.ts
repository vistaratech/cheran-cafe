import { create } from 'zustand';
import { IWorkstation } from '@/models/Workstation';
import { buildApiUrl } from '@/lib/helpers';

interface WorkstationEntities {
  workstations: Record<string, IWorkstation>;
}

interface WorkstationState {
  entities: WorkstationEntities;
  loading: boolean;
  error: string | null;
  // Form state
  form: {
    name: string;
    error: string;
  };
}

interface WorkstationActions {
  fetchWorkstations: (restaurantId?: string) => Promise<void>;
  addWorkstation: (workstationData: Partial<IWorkstation> & { name: string }) => Promise<IWorkstation>;
  updateWorkstation: (id: string, workstationData: Partial<IWorkstation>) => Promise<IWorkstation>;
  deleteWorkstation: (id: string) => Promise<void>;
  updateWorkstationPosition: (id: string, x: number, y: number) => Promise<void>;
  clearError: () => void;
  // Form state actions
  setFormName: (name: string) => void;
  setFormError: (error: string) => void;
  resetForm: (workstation?: IWorkstation) => void;
  clearForm: () => void;
}

interface WorkstationSelectors {
  getWorkstations: () => IWorkstation[];
  getWorkstationById: (id: string) => IWorkstation | undefined;
  getActiveWorkstations: () => IWorkstation[];
  getWorkstationByName: (name: string) => IWorkstation | undefined;
  getSortedWorkstations: () => IWorkstation[];
  // Form state selectors
  getFormName: () => string;
  getFormError: () => string;
  getIsFormValid: () => boolean;
}

type WorkstationStore = WorkstationState & WorkstationActions & WorkstationSelectors;

const initialState: WorkstationState = {
  entities: {
    workstations: {}
  },
  loading: false,
  error: null,
  form: {
    name: '',
    error: ''
  }
};

export const useWorkstationsStore = create<WorkstationStore>()((set, get) => ({
  ...initialState,

  // Actions
  fetchWorkstations: async (restaurantId?: string) => {
    set({ loading: true, error: null });
    try {
      const url = buildApiUrl('/api/workstations', restaurantId);
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        const workstations: Record<string, IWorkstation> = {};
        // Handle both array and single object responses
        const workstationsData = Array.isArray(result.data) ? result.data : [result.data];
        
        workstationsData.forEach((workstation: IWorkstation) => {
          workstations[workstation.id] = workstation;
        });
        
        set({
          entities: {
            ...get().entities,
            workstations
          },
          loading: false
        });
      } else {
        set({
          error: result.error || 'Failed to fetch workstations',
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

  addWorkstation: async (workstationData) => {
    try {
      const response = await fetch('/api/workstations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workstationData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        const newWorkstation = result.data;
        set((state) => ({
          entities: {
            ...state.entities,
            workstations: {
              ...state.entities.workstations,
              [newWorkstation.id]: newWorkstation
            }
          }
        }));
        return newWorkstation;
      } else {
        throw new Error(result.error || 'Failed to add workstation');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add workstation';
      set({ error: errorMessage });
      throw error;
    }
  },

  updateWorkstation: async (id, workstationData) => {
    try {
      const response = await fetch('/api/workstations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...workstationData }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        const updatedWorkstation = result.data;
        set((state) => ({
          entities: {
            ...state.entities,
            workstations: {
              ...state.entities.workstations,
              [id]: updatedWorkstation
            }
          }
        }));
        return updatedWorkstation;
      } else {
        throw new Error(result.error || 'Failed to update workstation');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update workstation';
      set({ error: errorMessage });
      throw error;
    }
  },

  deleteWorkstation: async (id) => {
    try {
      const response = await fetch('/api/workstations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        set((state) => {
          const newWorkstations = { ...state.entities.workstations };
          delete newWorkstations[id];
          return {
            entities: {
              ...state.entities,
              workstations: newWorkstations
            }
          };
        });
      } else {
        throw new Error(result.error || 'Failed to delete workstation');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete workstation';
      set({ error: errorMessage });
      throw error;
    }
  },

  updateWorkstationPosition: async (id, x, y) => {
    try {
      const response = await fetch(`/api/workstations/${id}/position`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ x, y }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        const updatedWorkstation = result.data;
        set((state) => ({
          entities: {
            ...state.entities,
            workstations: {
              ...state.entities.workstations,
              [id]: updatedWorkstation
            }
          }
        }));
      } else {
        throw new Error(result.error || 'Failed to update workstation position');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update workstation position';
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
        name,
        error: ''
      }
    }));
  },

  setFormError: (error) => {
    set((state) => ({
      form: {
        ...state.form,
        error
      }
    }));
  },

  resetForm: (workstation) => {
    set({
      form: {
        name: workstation?.name || '',
        error: ''
      }
    });
  },

  clearForm: () => {
    set({
      form: {
        name: '',
        error: ''
      }
    });
  },

  // Selectors
  getWorkstations: () => {
    const { entities } = get();
    return Object.values(entities.workstations);
  },

  getWorkstationById: (id) => {
    const { entities } = get();
    return entities.workstations[id];
  },

  getActiveWorkstations: () => {
    const { entities } = get();
    return Object.values(entities.workstations);
  },

  getWorkstationByName: (name) => {
    const { entities } = get();
    return Object.values(entities.workstations).find(
      workstation => workstation.name === name
    );
  },

  getSortedWorkstations: () => {
    const { entities } = get();
    return Object.values(entities.workstations).sort((a, b) => {
      // Sort by position, then by name
      if (a.position !== b.position) {
        return a.position - b.position;
      }
      return a.name.localeCompare(b.name);
    });
  },

  // Form selectors
  getFormName: () => get().form.name,
  getFormError: () => get().form.error,
  getIsFormValid: () => get().form.name.trim() !== ''
}));