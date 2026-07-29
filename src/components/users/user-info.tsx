"use client"

import { useUserStore } from "@/lib/stores/user-store";
import { useI18nStore } from '@/lib/stores/i18n-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function UserInfo() {
  const user = useUserStore().getCurrentUser();
  const { t } = useI18nStore();

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.user_info_title')}</CardTitle>
        <CardDescription>{t('profile.user_info_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{t('profile.name')}:</span>
          <span>{user.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">{t('profile.email')}:</span>
          <span>{user.email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">{t('profile.role')}:</span>
          <Badge variant={user.role === "Owner" ? "default" : user.role === "Admin" ? "secondary" : "outline"}>
            {user.role}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}