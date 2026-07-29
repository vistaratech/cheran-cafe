import { create } from 'zustand';
import { IRole } from '@/models/Role';
import { buildApiUrl } from '@/lib/helpers';

// Type alias for cleaner interface
type Role = IRole;

interface RoleEntities {
  roles: Record<string, Role>;
}

interface RolesState {
  entities: RoleEntities;
  loading: boolean;
  error: string | null;
}

// Simplified role data type for form submission
interface RoleData {
  name: string;
  description?: string;
  permissions: string[];
  allowedWorkstations?: string[];
  restaurantId?: string;
}

interface RolesActions {
  fetchRoles: (restaurantId?: string) => Promise<void>;
  addRole: (roleData: RoleData & { restaurantId: string }) => Promise<Role>;
  updateRole: (id: string, roleData: Partial<RoleData>) => Promise<Role>;
  deleteRole: (id: string) => Promise<void>;
  clearError: () => void;
}

interface RolesSelectors {
  getRoles: () => Role[];
  getRoleById: (id: string) => Role | undefined;
  getFilteredRoles: (filterFn: (role: Role) => boolean) => Role[];
  getRoleByName: (name: string) => Role | undefined;
  getAssignableRoles: () => Role[];
}

type RolesStore = RolesState & RolesActions & RolesSelectors;

const initialState: RolesState = {
  entities: {
    roles: {}
  },
  loading: false,
  error: null
};

export const useRolesStore = create<RolesStore>()((set, get) => ({
  ...initialState,

  // Actions
  fetchRoles: async (restaurantId?: string) => {
    set({ loading: true, error: null });
    try {
      const url = buildApiUrl('/api/roles', restaurantId);
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        const roles: Record<string, Role> = {};
        result.data.forEach((role: Role) => {
          roles[role.id] = role;
        });
        
        set({
          entities: {
            ...get().entities,
            roles
          },
          loading: false
        });
      } else {
        set({
          error: result.error || 'Failed to fetch roles',
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

  addRole: async (roleData) => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        const newRole = result.data;
        set((state) => ({
          entities: {
            ...state.entities,
            roles: {
              ...state.entities.roles,
              [newRole.id]: newRole
            }
          }
        }));
        return newRole;
      } else {
        throw new Error(result.error || 'Failed to add role');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add role';
      set({ error: errorMessage });
      throw error;
    }
  },

  updateRole: async (id, roleData) => {
    try {
      const response = await fetch(`/api/roles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        const updatedRole = result.data;
        set((state) => ({
          entities: {
            ...state.entities,
            roles: {
              ...state.entities.roles,
              [id]: updatedRole
            }
          }
        }));
        return updatedRole;
      } else {
        throw new Error(result.error || 'Failed to update role');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update role';
      set({ error: errorMessage });
      throw error;
    }
  },

  deleteRole: async (id) => {
    try {
      const response = await fetch(`/api/roles/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        set((state) => {
          const newRoles = { ...state.entities.roles };
          delete newRoles[id];
          return {
            entities: {
              ...state.entities,
              roles: newRoles
            }
          };
        });
      } else {
        throw new Error(result.error || 'Failed to delete role');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete role';
      set({ error: errorMessage });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  // Selectors
  getRoles: () => {
    const { entities } = get();
    return Object.values(entities.roles);
  },

  getRoleById: (id) => {
    const { entities } = get();
    return entities.roles[id];
  },

  getFilteredRoles: (filterFn) => {
    const { entities } = get();
    return Object.values(entities.roles).filter(filterFn);
  },

  getRoleByName: (name) => {
    const { entities } = get();
    return Object.values(entities.roles).find(role => role.name === name);
  },

  getAssignableRoles: () => {
    const { entities } = get();
    // Filter out system roles that shouldn't be assigned manually
    return Object.values(entities.roles).filter(role => 
      role.name !== 'Owner' // Owner role is typically system-managed
    );
  }
}));