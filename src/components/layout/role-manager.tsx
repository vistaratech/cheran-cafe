"use client"

import { useUserStore } from "@/lib/stores/user-store";
import { useI18nStore } from '@/lib/stores/i18n-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function RoleManager() {
  const user = useUserStore().getCurrentUser();
  const { updateUserRole } = useUserStore();
  const { t } = useI18nStore();
  
  // Only owners and admins can manage roles
  const isOwner = user?.role === "Owner";
  const isAdmin = user?.role === "Admin";
  
  if (!isOwner && !isAdmin) {
    return null;
  }

  const handleRoleChange = (newRole: 'Owner' | 'Admin' | 'Staff') => {
    updateUserRole(user.id, newRole);
    toast.success(t('profile.toast.role_updated_title'), {
      description: t('profile.toast.role_updated_desc', { role: newRole }),
      duration: 3000,
    });
  };

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.role_management_title')}</CardTitle>
        <CardDescription>{t('profile.role_management_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">{t('profile.change_role')}</h3>
            <Select value={user.role} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('profile.select_role')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Owner">{t('profile.roles.owner')}</SelectItem>
                <SelectItem value="Admin">{t('profile.roles.admin')}</SelectItem>
                <SelectItem value="Staff">{t('profile.roles.staff')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>
              {user.role === "Owner" && t('profile.role_descriptions.owner')}
              {user.role === "Admin" && t('profile.role_descriptions.admin')}
              {user.role === "Staff" && t('profile.role_descriptions.staff')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}