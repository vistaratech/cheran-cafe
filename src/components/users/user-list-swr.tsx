"use client";

import useSWR from 'swr';
import { fetcher } from '@/lib/swr-fetcher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Staff';
  status: 'On Shift' | 'Off Shift' | 'On Break';
  membership: 'free' | 'pro';
}

export function UserListSWR() {
  const { data, error, isLoading, isValidating } = useSWR<User[]>(
    '/api/users',
    fetcher,
    {
      fallbackData: [],
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Failed to load users</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading users</AlertTitle>
            <AlertDescription>
              {error.message || "An unexpected error occurred while loading users. Please try again later."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
          Manage your restaurant staff
          {isValidating && <span className="ml-2">Refreshing...</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {data?.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant={
                  user.role === "Owner" ? "default" : 
                  user.role === "Admin" ? "secondary" : "outline"
                }>
                  {user.role}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}