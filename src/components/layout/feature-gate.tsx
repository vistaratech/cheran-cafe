"use client"

import React from 'react';
import { useUserStore } from '@/lib/stores/user-store';

interface FeatureAccessProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureAccess({ feature, children, fallback = null }: FeatureAccessProps) {
  const currentUser = useUserStore().getCurrentUser();
  
  if (!currentUser) {
    return fallback;
  }
  
  // Simple role-based access control
  const hasAccess = (() => {
    // Owners have access to everything
    if (currentUser.role === 'Owner') {
      return true;
    }
    
    // Map features to required roles
    const featureRoles: Record<string, string[]> = {
      'menu': ['Admin', 'Staff', 'Waiter', 'Cashier'],
      'orders': ['Admin', 'Staff', 'Waiter', 'Cashier'],
      'kds': ['Admin', 'Kitchen Staff'],
      'reports': ['Owner', 'Admin'],
      'restaurant': ['Owner', 'Admin'],
      'users': ['Owner', 'Admin'],
      'payments': ['Admin', 'Cashier'],
      'inventory': ['Admin', 'Kitchen Staff']
    };
    
    // Check if the current user's role is in the allowed roles for this feature
    if (featureRoles[feature]) {
      return featureRoles[feature].includes(currentUser.role);
    }
    
    // Default behavior
    return false;
  })();
  
  return hasAccess ? <>{children}</> : fallback;
}