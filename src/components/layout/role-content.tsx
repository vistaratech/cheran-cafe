"use client"

import { useUserStore } from "@/lib/stores/user-store";

interface RoleBasedContentProps {
  children: React.ReactNode;
  allowedRoles?: 'Owner' | 'Admin' | 'Staff' | ('Owner' | 'Admin' | 'Staff')[];
  allowedRestaurantMembership?: "free" | "pro";
  fallback?: React.ReactNode;
}

export function RoleBasedContent({
  children,
  allowedRoles,
  allowedRestaurantMembership,
  fallback = null,
}: RoleBasedContentProps) {
  const user = useUserStore().getCurrentUser();

  // If no roles specified, allow access
  if (!allowedRoles) return <>{children}</>;

  // If no user, deny access
  if (!user) return <>{fallback}</>;

  // Check role access
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const hasRoleAccess = rolesArray.includes(user.role as 'Owner' | 'Admin' | 'Staff');

  // Check restaurant membership access
  // Note: restaurantMembership is checked via the user's restaurant data
  const hasMembershipAccess = !allowedRestaurantMembership || (user as any).restaurantMembership === allowedRestaurantMembership;

  if (hasRoleAccess && hasMembershipAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}