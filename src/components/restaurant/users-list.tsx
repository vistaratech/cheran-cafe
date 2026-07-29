"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MoreHorizontal,
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  User,
  Mail,
  Shield,
  Clock,
  Link2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useI18nStore } from '@/lib/stores/i18n-store'
import { useUsersStore } from '@/lib/stores/users-store'
import { useUserStore } from '@/lib/stores/user-store'
import { toast } from "sonner"
import { InviteDialog } from './invite-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserDialog } from './user-dialog'

import { IUser } from '@/models/User';

// Type alias for cleaner interface
type User = IUser;

// Type for the UserDialog which requires email to be defined
interface UserDialogUserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'On Shift' | 'Off Shift' | 'On Break';
}

import { IRole } from '@/models/Role';

// Type alias for cleaner interface
type Role = IRole;

export function UsersList() {
  const { t } = useI18nStore()
  const usersStore = useUsersStore()
  const currentUser = useUserStore((state) => state.getCurrentUser())
  
  const users = usersStore.getUsers()
  const roles = usersStore.getRoles()
  const loading = usersStore.loading
  const error = usersStore.error
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  // Listen for events from the restaurant page header buttons
  useEffect(() => {
    const handleOpenAddUser = () => handleOpenDialog();
    const handleOpenInvite = () => setIsInviteDialogOpen(true);

    window.addEventListener('openAddUserDialog', handleOpenAddUser);
    window.addEventListener('openInviteDialog', handleOpenInvite);

    return () => {
      window.removeEventListener('openAddUserDialog', handleOpenAddUser);
      window.removeEventListener('openInviteDialog', handleOpenInvite);
    };
  }, []);

  // Fetch users and roles
  useEffect(() => {
    usersStore.fetchUsers(currentUser?.restaurantId);
    usersStore.fetchRoles(currentUser?.restaurantId);
  }, [currentUser?.restaurantId])

  const handleOpenDialog = (user?: User) => {
    setEditingUser(user || null)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingUser(null)
  }

  const handleSaveUser = async (userData: any) => {
    try {
      if (editingUser) {
        // Update existing user
        await usersStore.updateUser(editingUser.id, userData);
        toast.success(t('restaurant.users.updated_success'))
      } else {
        // Add new user
        await usersStore.addUser(userData);
        toast.success(t('restaurant.users.created_success'))
      }
      handleCloseDialog()
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error(t('restaurant.users.save_error'))
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      setDeletingUserId(userId)
      await usersStore.deleteUser(userId);
      toast.success(t('restaurant.users.deleted_success'))
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(t('restaurant.users.delete_error'))
    } finally {
      setDeletingUserId(null)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'On Shift':
        return 'default'
      case 'On Break':
        return 'secondary'
      default:
        return 'outline'
    }
  }



  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mobile view */}
      <div className="md:hidden">
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('restaurant.users.no_users')}
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{user.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('restaurant.users.actions')}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenDialog(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t('restaurant.users.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deletingUserId === user.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {deletingUserId === user.id ? t('restaurant.users.deleting') : t('restaurant.users.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary">{user.role}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Badge variant={getStatusVariant(user.status)}>
                        {user.status}
                      </Badge>
                    </div>

                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Desktop view */}
      <div className="hidden md:block">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('restaurant.users.table.name')}</TableHead>
                <TableHead>{t('restaurant.users.table.email')}</TableHead>
                <TableHead>{t('restaurant.users.table.role')}</TableHead>
                <TableHead>{t('restaurant.users.table.status')}</TableHead>
                <TableHead className="text-right">{t('restaurant.users.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('restaurant.users.actions')}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenDialog(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t('restaurant.users.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deletingUserId === user.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {deletingUserId === user.id ? t('restaurant.users.deleting') : t('restaurant.users.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t('restaurant.users.no_users')}
            </div>
          )}
        </div>
      </div>

      <UserDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        user={editingUser ? {
          id: editingUser.id,
          name: editingUser.name,
          email: editingUser.email || '',
          role: editingUser.role,
          status: editingUser.status,
        } as UserDialogUserData : null}
        onSave={handleSaveUser}
        onClose={handleCloseDialog}
      />

      <InviteDialog
        isOpen={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        roles={roles}
      />
    </div>
  )
}