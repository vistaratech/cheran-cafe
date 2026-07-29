import { create } from 'zustand';
import { IUser } from '@/models/User';
import { IRole } from '@/models/Role';
import { buildApiUrl } from '@/lib/helpers';

// Type aliases for cleaner interface
type User = IUser;
type Role = IRole;

interface UserEntities {
  users: Record<string, User>;
  roles: Record<string, Role>;
}

interface UsersState {
  entities: UserEntities;
  loading: boolean;
  error: string | null;
  // Form state
  form: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: string;
    status: 'On Shift' | 'Off Shift' | 'On Break';
  };
}

interface UsersActions {
  fetchUsers: (restaurantId?: string) => Promise<void>;
  fetchRoles: (restaurantId?: string) => Promise<void>;
  addUser: (userData: Omit<User, 'id'>) => Promise<User>;
  updateUser: (id: string, userData: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  assignRole: (userId: string, roleId: string) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  // Form state actions
  setFormName: (name: string) => void;
  setFormEmail: (email: string) => void;
  setFormPassword: (password: string) => void;
  setFormConfirmPassword: (confirmPassword: string) => void;
  setFormRole: (role: string) => void;
  setFormStatus: (status: 'On Shift' | 'Off Shift' | 'On Break') => void;
  resetForm: (isEditing?: boolean, user?: Partial<User> | null) => void;
  clearForm: () => void;
}

interface UsersSelectors {
  getUsers: () => User[];
  getUserById: (id: string) => User | undefined;
  getFilteredUsers: (filterFn: (user: User) => boolean) => User[];
  getRoles: () => Role[];
  getRoleById: (id: string) => Role | undefined;
  getUsersByRole: (role: string) => User[];
  getActiveUsers: () => User[];
  // Form state selectors
  getFormName: () => string;
  getFormEmail: () => string;
  getFormPassword: () => string;
  getFormConfirmPassword: () => string;
  getFormRole: () => string;
  getFormStatus: () => 'On Shift' | 'Off Shift' | 'On Break';
  getIsFormValid: () => boolean;
  getFormErrors: () => string[];
}

type UsersStore = UsersState & UsersActions & UsersSelectors;

const initialState: UsersState = {
  entities: {
    users: {},
    roles: {}
  },
  loading: false,
  error: null,
  form: {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    status: 'Off Shift'
  }
};

export const useUsersStore = create<UsersStore>()((set, get) => ({
  ...initialState,

  // Actions
  fetchUsers: async (restaurantId?: string) => {
    set({ loading: true, error: null });
    try {
      const url = buildApiUrl('/api/users', restaurantId);
      const response = await fetch(url);
      const result = await response.json();
      
      if (Array.isArray(result)) {
        const users: Record<string, User> = {};
        result.forEach((user: User) => {
          users[user.id] = user;
        });
        
        set((state) => ({
          entities: {
            ...state.entities,
            users
          },
          loading: false
        }));
      } else {
        set({
          error: 'Failed to fetch users',
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

  fetchRoles: async (restaurantId?: string) => {
    try {
      const url = buildApiUrl('/api/roles', restaurantId);
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        const roles: Record<string, Role> = {};
        result.data.forEach((role: Role) => {
          roles[role.id] = role;
        });
        
        set((state) => ({
          entities: {
            ...state.entities,
            roles
          }
        }));
      } else {
        set({
          error: result.error || 'Failed to fetch roles'
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  },

  addUser: async (userData) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const result = await response.json();
      
      if (result.success || response.ok) {
        const newUser = result.data || result;
        set((state) => ({
          entities: {
            ...state.entities,
            users: {
              ...state.entities.users,
              [newUser.id]: newUser
            }
          }
        }));
        return newUser;
      } else {
        throw new Error(result.error || 'Failed to add user');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add user';
      set({ error: errorMessage });
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const result = await response.json();
      
      if (result.success || response.ok) {
        const updatedUser = result.data || result;
        set((state) => ({
          entities: {
            ...state.entities,
            users: {
              ...state.entities.users,
              [id]: { ...state.entities.users[id], ...updatedUser }
            }
          }
        }));
        return updatedUser;
      } else {
        throw new Error(result.error || 'Failed to update user');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      set({ error: errorMessage });
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success || response.ok) {
        set((state) => {
          const newUsers = { ...state.entities.users };
          delete newUsers[id];
          return {
            entities: {
              ...state.entities,
              users: newUsers
            }
          };
        });
      } else {
        throw new Error(result.error || 'Failed to delete user');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      set({ error: errorMessage });
      throw error;
    }
  },

  assignRole: async (userId, roleId) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roleId }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        const updatedUser = result.data;
        set((state) => ({
          entities: {
            ...state.entities,
            users: {
              ...state.entities.users,
              [userId]: updatedUser
            }
          }
        }));
      } else {
        throw new Error(result.error || 'Failed to assign role');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign role';
      set({ error: errorMessage });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading) => {
    set({ loading });
  },

  // Selectors
  getUsers: () => {
    const { entities } = get();
    return Object.values(entities.users);
  },

  getUserById: (id) => {
    const { entities } = get();
    return entities.users[id];
  },

  getFilteredUsers: (filterFn) => {
    const { entities } = get();
    return Object.values(entities.users).filter(filterFn);
  },

  getRoles: () => {
    const { entities } = get();
    return Object.values(entities.roles);
  },

  getRoleById: (id) => {
    const { entities } = get();
    return entities.roles[id];
  },

  getUsersByRole: (role) => {
    const { entities } = get();
    return Object.values(entities.users).filter(user => user.role === role);
  },

  getActiveUsers: () => {
    const { entities } = get();
    return Object.values(entities.users).filter(user => user.status === 'On Shift');
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

  setFormEmail: (email) => {
    set((state) => ({
      form: {
        ...state.form,
        email
      }
    }));
  },

  setFormPassword: (password) => {
    set((state) => ({
      form: {
        ...state.form,
        password
      }
    }));
  },

  setFormConfirmPassword: (confirmPassword) => {
    set((state) => ({
      form: {
        ...state.form,
        confirmPassword
      }
    }));
  },

  setFormRole: (role) => {
    set((state) => ({
      form: {
        ...state.form,
        role
      }
    }));
  },

  setFormStatus: (status) => {
    set((state) => ({
      form: {
        ...state.form,
        status
      }
    }));
  },

  resetForm: (isEditing = false, user = null) => {
    if (isEditing && user) {
      set({
        form: {
          name: user.name || '',
          email: user.email || '',
          password: '',
          confirmPassword: '',
          role: user.role || '',
          status: user.status || 'Off Shift'
        }
      });
    } else {
      set({
        form: {
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: '',
          status: 'Off Shift'
        }
      });
    }
  },

  clearForm: () => {
    set({
      form: {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        status: 'Off Shift'
      }
    });
  },

  // Form selectors
  getFormName: () => get().form.name,
  getFormEmail: () => get().form.email,
  getFormPassword: () => get().form.password,
  getFormConfirmPassword: () => get().form.confirmPassword,
  getFormRole: () => get().form.role,
  getFormStatus: () => get().form.status,
  
  getIsFormValid: () => {
    const { form } = get();
    const errors = get().getFormErrors();
    return errors.length === 0 && 
           form.name.trim() !== '' && 
           form.email.trim() !== '' && 
           form.role !== '';
  },
  
  getFormErrors: () => {
    const { form } = get();
    const errors: string[] = [];
    
    if (!form.name.trim()) {
      errors.push('Name is required');
    }
    
    if (!form.email.trim()) {
      errors.push('Email is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        errors.push('Invalid email format');
      }
    }
    
    if (!form.role) {
      errors.push('Role is required');
    }
    
    return errors;
  }
}));