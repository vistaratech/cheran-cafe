import { create } from 'zustand';
import { StaffPerformance } from '@/lib/types';

// Simplified User interface without Mongoose document methods
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'Owner' | 'Admin' | 'Staff' | string; // Extended to support custom roles
  status: 'On Shift' | 'Off Shift' | 'On Break';
  restaurantId?: string;
  restaurantMembership?: 'free' | 'pro'; // Membership belongs to the restaurant, not the user
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any; // Allow additional properties
}

// Define normalized entities
interface NormalizedEntities {
  users: Record<string, User>;
}

interface NormalizedState {
  entities: NormalizedEntities;
  currentUserId: string | null;
}

interface NormalizedUserState extends NormalizedState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserRole: (userId: string, role: 'Owner' | 'Admin' | 'Staff' | string) => void;
  refreshUser: (currentEmail: string) => Promise<void>;
  updateUserOptimistically: (userId: string, updates: Partial<User>) => void;
  setUser: (user: User | null) => void;
  updateRestaurantMembership: (restaurantId: string, membership: 'free' | 'pro') => void;

  // Selector helpers
  getCurrentUser: () => User | null;
  getUserById: (id: string) => User | undefined;
}

// Initial state
const initialState: NormalizedState = {
  entities: {
    users: {}
  },
  currentUserId: null
};

export const useUserStore = create<NormalizedUserState>()((set, get) => ({
  ...initialState,
  
  setUser: (user) => {
    if (user) {
      set((state) => ({
        entities: {
          ...state.entities,
          users: {
            ...state.entities.users,
            [user.id]: user
          }
        },
        currentUserId: user.id
      }));
      // Persist user data with consistent key
      localStorage.setItem('chefcito-user', JSON.stringify(user));
      console.log('User data set in store and localStorage:', user.email);
    } else {
      set({ currentUserId: null });
      localStorage.removeItem('chefcito-user');
    }
  },
  
  login: async (email, password) => {
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const userData = await response.json();
      // Create a plain object from the user data to avoid Mongoose document issues
      const plainUser = JSON.parse(JSON.stringify(userData.user));
      set((state) => ({
        entities: {
          ...state.entities,
          users: {
            ...state.entities.users,
            [userData.user.id]: plainUser
          }
        },
        currentUserId: userData.user.id
      }));
      localStorage.setItem('chefcito-user', JSON.stringify(plainUser));
      return true;
    } catch (error) {
      // Login error handled silently
      return false;
    }
  },
  
  logout: () => {
    set({ currentUserId: null });
    localStorage.removeItem('chefcito-user');
  },
  
  updateRestaurantMembership: (restaurantId, membership) => {
    set((state) => {
      const updatedUsers = { ...state.entities.users };
      let userUpdated = false;

      // Update all users belonging to this restaurant
      for (const [id, user] of Object.entries(updatedUsers)) {
        if (user.restaurantId === restaurantId && user.restaurantMembership !== membership) {
          updatedUsers[id] = { ...user, restaurantMembership: membership };
          userUpdated = true;
        }
      }

      if (userUpdated) {
        return {
          entities: {
            ...state.entities,
            users: updatedUsers
          }
        };
      }
      return state;
    });
  },
  
  updateUserRole: (userId, role) => {
    set((state) => {
      const user = state.entities.users[userId];
      if (user) {
        const updatedUser = { ...user, role };
        return {
          entities: {
            ...state.entities,
            users: {
              ...state.entities.users,
              [userId]: updatedUser
            }
          }
        };
      }
      return state;
    });
    
    // Also update on the backend
    fetch(`/api/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    }).catch(error => {
      // Role update error handled silently
    });
  },
  
  refreshUser: async (currentEmail) => {
    try {
      const response = await fetch(`/api/users/login?email=${encodeURIComponent(currentEmail)}`);
      if (response.ok) {
        const userData = await response.json();
        // Create a plain object from the user data to avoid Mongoose document issues
        const plainUser = JSON.parse(JSON.stringify(userData));
        set((state) => ({
          entities: {
            ...state.entities,
            users: {
              ...state.entities.users,
              [userData.id]: plainUser
            }
          },
          currentUserId: userData.id
        }));
        // Use consistent key with setUser and login functions
        localStorage.setItem('chefcito-user', JSON.stringify(plainUser));
        console.log('User data refreshed successfully for:', currentEmail);
      } else {
        console.warn('Failed to refresh user data, status:', response.status);
      }
    } catch (e) {
      console.error('Error refreshing user data:', e);
      // User data refresh error handled silently
    }
  },
  
  // Optimistic update for immediate UI feedback
  updateUserOptimistically: (userId: string, updates: Partial<User>) => {
    set((state) => {
      const currentUser = state.entities.users[userId];
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updates, updatedAt: new Date() };
        // Also persist to localStorage for consistency
        localStorage.setItem('chefcito-user', JSON.stringify(updatedUser));
        console.log('User updated optimistically and persisted:', updatedUser.email, updates);
        return {
          entities: {
            ...state.entities,
            users: {
              ...state.entities.users,
              [userId]: updatedUser
            }
          }
        };
      }
      return state;
    });
  },
  
  // Selector helpers
  getCurrentUser: () => {
    const { entities, currentUserId } = get();
    return currentUserId ? entities.users[currentUserId] : null;
  },
  
  getUserById: (id) => {
    const { entities } = get();
    return entities.users[id];
  }
}));