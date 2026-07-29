// Define permissions
export type Permission =
  | 'menu_access'
  | 'order_management'
  | 'kds_access'
  | 'reports_access'
  | 'restaurant_settings'
  | 'user_management'
  | 'payment_processing'
  | 'inventory_management';

// Define a simplified user interface that matches both frontend and backend user types
interface User {
  role: string;
  restaurantId?: string;
  restaurantMembership?: 'free' | 'pro';
  [key: string]: any;
}

// Define predefined roles and their permissions (exported for use in hooks)
export const PREDEFINED_ROLES: Record<string, Permission[]> = {
  'Owner': [
    'menu_access',
    'order_management',
    'kds_access',
    'reports_access',
    'restaurant_settings',
    'user_management',
    'payment_processing',
    'inventory_management'
  ],
  'Admin': [
    'menu_access',
    'order_management',
    'kds_access',
    'reports_access',
    'restaurant_settings',
    'user_management',
    'payment_processing',
    'inventory_management'
  ],
  'Staff': [
    'menu_access',
    'order_management'
  ],
  'Waiter': [
    'menu_access',
    'order_management'
  ],
  'Cashier': [
    'menu_access',
    'order_management',
    'payment_processing'
  ],
  'Kitchen Staff': [
    'kds_access',
    'inventory_management'
  ]
};

// Function to check if a user has a specific permission
export async function hasPermission(user: User, permission: Permission): Promise<boolean> {
  // Owners and Admins have all permissions
  if (user.role === 'Owner' || user.role === 'Admin') {
    return true;
  }

  // Check if the user's role has the required permission
  if (PREDEFINED_ROLES[user.role]) {
    return PREDEFINED_ROLES[user.role].includes(permission);
  }

  // For custom roles, we would need to fetch the role from the database
  // This is a simplified implementation - in a full implementation,
  // we would fetch the role details from the database
  try {
    const response = await fetch(`/api/roles`);
    const result = await response.json();
    
    if (result.success) {
      const role = result.data.find((r: any) => r.name === user.role);
      if (role && role.permissions) {
        return role.permissions.includes(permission);
      }
    }
  } catch (error) {
    console.error('Error checking permissions:', error);
  }

  // Default to false if we can't determine permissions
  return false;
}

// Function to check if a user has access to a specific feature
export function hasFeatureAccess(user: User, feature: string): boolean {
  // Owners have access to everything
  if (user.role === 'Owner') {
    return true;
  }

  // Map features to required permissions
  const featurePermissions: Record<string, Permission> = {
    'menu': 'menu_access',
    'orders': 'order_management',
    'kds': 'kds_access',
    'reports': 'reports_access',
    'restaurant': 'restaurant_settings',
    'users': 'user_management',
    'payments': 'payment_processing',
    'inventory': 'inventory_management'
  };

  // Check if the feature requires a specific permission
  if (featurePermissions[feature]) {
    // In a real implementation, we would asynchronously check permissions
    // For now, we'll use a simplified synchronous check
    if (PREDEFINED_ROLES[user.role]) {
      return PREDEFINED_ROLES[user.role].includes(featurePermissions[feature]);
    }
    return false;
  }

  // Default behavior for unknown features
  switch (feature) {
    case 'pos':
      return user.role === 'Staff' || user.role === 'Waiter' || user.role === 'Cashier';
    default:
      return user.role === 'Admin';
  }
}

/**
 * Synchronously resolve a user's permissions given pre-fetched custom roles.
 * Returns the full permissions array for the user.
 */
export function resolvePermissions(user: User, customRoles: { name: string; permissions: string[] }[] = []): string[] {
  if (!user) return [];
  if (user.role === 'Owner' || user.role === 'Admin') {
    return [
      'menu_access', 'order_management', 'kds_access', 'reports_access',
      'restaurant_settings', 'user_management', 'payment_processing',
      'inventory_management', 'role_management'
    ];
  }
  if (PREDEFINED_ROLES[user.role]) {
    return PREDEFINED_ROLES[user.role] as string[];
  }
  const role = customRoles.find(r => r.name === user.role);
  return role?.permissions ?? [];
}

/**
 * Synchronously check if user has a specific permission given pre-fetched custom roles.
 */
export function canSync(user: User, permission: string, customRoles: { name: string; permissions: string[] }[] = []): boolean {
  return resolvePermissions(user, customRoles).includes(permission);
}

/**
 * Returns allowed KDS workstation IDs for the user.
 * Empty array means the user can see all workstations.
 */
export function resolveAllowedWorkstations(
  user: User,
  customRoles: { name: string; permissions: string[]; allowedWorkstations?: string[] }[] = []
): string[] {
  if (!user) return [];
  // Predefined roles (including Owner/Admin) have full workstation access
  if (user.role === 'Owner' || user.role === 'Admin' || PREDEFINED_ROLES[user.role]) return [];
  const role = customRoles.find(r => r.name === user.role);
  return role?.allowedWorkstations ?? [];
}