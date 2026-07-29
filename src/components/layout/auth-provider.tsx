"use client";
import React, { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserStore } from "@/lib/stores/user-store";
import { clearSWRCache } from "@/lib/swr-fetcher";
import { AppLayoutContent } from "@/components/layout/app-layout";

// Wrapper function that clears SWR cache on logout
const logoutWithCacheClear = () => {
  clearSWRCache();
  useUserStore.getState().logout();
  console.log('[Auth] Logout completed with cache cleared');
};

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setUser, getCurrentUser } = useUserStore();
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('chefcito-user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUser(user);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('chefcito-user');
      }
    }
    setIsLoaded(true);
  }, [setUser]);

  const user = getCurrentUser();
  const isAuthenticated = !!user;
  // Pages that don't require auth and render without the app layout
  const isPublicPage = pathname.startsWith('/login')
    || pathname.startsWith('/register')
    || pathname.startsWith('/thank-you');

  // Redirect unauthenticated users after load — must be in an effect, not render
  useEffect(() => {
    if (isLoaded && !isAuthenticated && !isPublicPage) {
      router.push('/login');
    }
  }, [isLoaded, isAuthenticated, isPublicPage, router]);

  // Public pages: render without app layout, no auth required
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Wait for user data to load before making auth decision
  if (!isLoaded) {
    return null;
  }

  // Still unauthenticated — render nothing while the effect redirects
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated - render children with app layout
  return <AppLayoutContent>{children}</AppLayoutContent>;
}

export function useAuth() {
  const { getCurrentUser, logout } = useUserStore();
  const user = getCurrentUser();

  return useMemo(() => ({
    isAuthenticated: !!user,
    user,
    logout: logoutWithCacheClear
  }), [user]);
}