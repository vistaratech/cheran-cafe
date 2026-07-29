// Access control types
export type Feature = 'orders' | 'kds' | 'reports' | 'restaurant' | 'pos';

export interface User {
  role: 'Owner' | 'Admin' | 'Staff';
  restaurantId?: string;
  restaurantMembership?: 'free' | 'pro';
}

// KDS constants
export const KDS_STATES = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  READY: 'Ready'
} as const;

export type KDSState = typeof KDS_STATES[keyof typeof KDS_STATES];

export const WORKSTATION_FLOW = {
  INITIAL_STATUS: 'New',
  FINAL_STATUS: 'Ready' // Changed from 'served' to 'Ready' as the final workstation is for ready items
} as const;

/**
 * Check if a user has access to a specific feature
 * 
 * @param user - The user to check access for
 * @param feature - The feature to check access to
 * @returns Whether the user has access to the feature
 */
export function hasAccess(user: User | null, feature: Feature): boolean {
  if (!user) return false;
  
  // Owners have access to everything
  if (user.role === 'Owner') return true;
  
  // Staff only have access to POS by default
  if (user.role === 'Staff') {
    return feature === 'pos';
  }
  
  // Admins have access to most features except some premium ones
  switch (feature) {
    case 'pos':
    case 'orders':
    case 'kds':
    case 'restaurant':
      return true;
    case 'reports':
      // Reports might be a premium feature
      return user.restaurantMembership === 'pro';
    default:
      return false;
  }
}