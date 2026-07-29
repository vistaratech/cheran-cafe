"use client";
import Link from "next/link";
import {
  ChefHat,
  LayoutGrid,
  ClipboardList,
  Utensils,
  LogOut,
  User,
  Type,
  Languages,
  Settings,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/helpers";
import { useI18nStore } from "@/lib/stores/i18n-store";
import { useAuth } from "@/components/layout/auth-provider";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { useRolesStore } from "@/lib/stores/roles-store";

// Simple cookie utility
const eraseCookie = (name: string) => {
  document.cookie = name + '=; Max-Age=-99999999; path=/;';
};

// Permission required to see each nav route (Owner/Admin always see everything)
const NAV_PERMISSIONS: Record<string, string> = {
  '/pos': 'order_management',
  '/kds': 'kds_access',
  '/restaurant': 'restaurant_settings',
  '/reports': 'reports_access',
};

import { CheranLogo } from "@/components/ui/cheran-logo";

export function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18nStore();
  const { logout } = useAuth();
  const [fontSize, setFontSize] = useState("medium");
  const { can } = usePermissions();
  const fetchRoles = useRolesStore((s) => s.fetchRoles);
  const rolesLoaded = useRolesStore((s) => Object.keys(s.entities.roles).length > 0);

  // Ensure custom roles are loaded so permission checks work for custom roles
  useEffect(() => {
    if (!rolesLoaded) {
      fetchRoles();
    }
  }, [rolesLoaded, fetchRoles]);

  const allMenuItems = [
    { href: "/pos", label: t('pos.title'), icon: LayoutGrid },
    { href: "/kds", label: t('kds.title'), icon: ClipboardList },
    { href: "/restaurant", label: t('restaurant.title'), icon: Utensils },
    { href: "/reports", label: t('reports.title'), icon: BarChart3 },
    { href: "/profile", label: t('profile.title'), icon: Settings, isHidden: true },
  ];

  // Filter nav items the current user is allowed to see
  const menuItems = allMenuItems.filter((item) => {
    if (item.isHidden) return true; // always keep hidden items (profile)
    const requiredPermission = NAV_PERMISSIONS[item.href];
    if (!requiredPermission) return true;
    return can(requiredPermission);
  });

  const getPageTitle = () => {
    const currentItem = menuItems.find((item) => pathname.startsWith(item.href));
    if (currentItem) {
      return currentItem.label;
    }
    return t('app.title');
  };

  const currentPage = getPageTitle();

  const handleLogout = async () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-screen bg-[#FAF6F0]">
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 bg-white/80 border-b border-amber-900/10 h-16 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/pos" className="flex items-center gap-3 group">
            <CheranLogo size={44} className="transition-all duration-300 group-hover:scale-105 drop-shadow-md flex-shrink-0" />
            <span className="text-2xl font-headline font-bold text-[#593722] tracking-tight hidden sm:inline-block">Cheran Cafe</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 bg-amber-900/5 p-1 rounded-full border border-amber-900/10">
            {menuItems.filter(item => !item.isHidden).map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Button 
                  key={item.href} 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "rounded-full transition-all font-medium text-sm px-4",
                    isActive 
                      ? "bg-[#593722] text-white shadow-sm hover:bg-[#593722]/90" 
                      : "text-[#593722]/80 hover:text-[#593722] hover:bg-amber-900/10"
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-headline font-semibold md:hidden">
              {currentPage}
            </h2>
            <UserNav fontSize={fontSize} onFontSizeChange={setFontSize} onLogout={handleLogout} />
          </div>
        </div>
      </header>

      <main className={cn("flex-1 overflow-auto p-4 sm:p-6 bg-muted/30", `font-size-${fontSize}`, "pb-24 md:pb-6")}>
        {children}
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-background/95 border-t backdrop-blur-sm md:hidden">
        <div className="flex h-16 max-w-lg mx-auto justify-around items-center">
          {menuItems.filter(item => !item.isHidden).map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}>
                <item.icon className="h-6 w-6" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function UserNav({ fontSize, onFontSizeChange, onLogout }: { fontSize: string, onFontSizeChange: (size: string) => void, onLogout: () => void }) {
  const { t, language, setLanguage } = useI18nStore();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary/50 flex items-center justify-center">
            <User className="h-5 w-5" />
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{t('userMenu.staff_member')}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {t('userMenu.email')}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>{t('userMenu.profile')}</span>
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Type className="mr-2 h-4 w-4" />
            <span>{t('userMenu.font_size.title')}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={fontSize} onValueChange={onFontSizeChange}>
                <DropdownMenuRadioItem value="small">{t('userMenu.font_size.small')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="medium">{t('userMenu.font_size.medium')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="large">{t('userMenu.font_size.large')}</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages className="mr-2 h-4 w-4" />
            <span>{t('userMenu.language.title')}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={language} onValueChange={(value: string) => setLanguage(value as 'en' | 'es')}>
                <DropdownMenuRadioItem value="en">{t('userMenu.language.en')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="es">{t('userMenu.language.es')}</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('userMenu.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}