"use client";
import { useMemo } from 'react';
import { useUserStore } from '@/lib/stores/user-store';
import { useRolesStore } from '@/lib/stores/roles-store';
import { canSync, resolveAllowedWorkstations } from '@/lib/access-control';

/**
 * Hook that exposes the current user's resolved permissions.
 * Works for both predefined and custom roles. Custom role data is read
 * from the Zustand roles store, which is populated by RolesList or AppLayoutContent.
 */
export function usePermissions() {
  const user = useUserStore((s) => s.getCurrentUser());
  // Select the stable entities object, NOT getRoles() — calling getRoles() inside a
  // selector returns a new array on every render, breaking Zustand's snapshot cache.
  const rolesEntities = useRolesStore((s) => s.entities.roles);
  const customRoles = useMemo(() => Object.values(rolesEntities), [rolesEntities]);

  /** Returns true if the current user has the given permission. */
  function can(permission: string): boolean {
    if (!user) return false;
    return canSync(user, permission, customRoles);
  }

  /**
   * Returns the list of workstation IDs this user is allowed to see in KDS.
   * An empty array means the user can see all workstations.
   */
  function getAllowedWorkstations(): string[] {
    if (!user) return [];
    return resolveAllowedWorkstations(user, customRoles);
  }

  return { can, getAllowedWorkstations, user };
}
