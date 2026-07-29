"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus } from "lucide-react"
import { useI18nStore } from '@/lib/stores/i18n-store'
import { toast } from "sonner"
import { useUserStore } from "@/lib/stores/user-store"
import { useRolesStore } from '@/lib/stores/roles-store'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-fetcher'
import { type IWorkstation } from '@/models/Workstation'
import { IRole } from '@/models/Role'
import { UsersList } from './users-list'

type Role = IRole;

interface RoleData {
  name: string;
  description?: string;
  permissions: string[];
  allowedWorkstations: string[];
}

// Permission groups rendered in the dialog
const PERMISSION_GROUPS = [
  {
    labelKey: 'restaurant.roles.permission_groups.pos_orders',
    fallback: 'POS & Orders',
    permissions: [
      { id: 'menu_access', labelKey: 'restaurant.roles.permissions.manage_menu', fallback: 'Manage menu' },
      { id: 'order_management', labelKey: 'restaurant.roles.permissions.manage_orders', fallback: 'Manage orders' },
      { id: 'payment_processing', labelKey: 'restaurant.roles.permissions.manage_payments', fallback: 'Process payments' },
    ]
  },
  {
    labelKey: 'restaurant.roles.permission_groups.kitchen',
    fallback: 'Kitchen',
    permissions: [
      { id: 'kds_access', labelKey: 'restaurant.roles.permissions.kds_access', fallback: 'Kitchen display (KDS)' },
      { id: 'inventory_management', labelKey: 'restaurant.roles.permissions.manage_inventory', fallback: 'Manage inventory' },
    ]
  },
  {
    labelKey: 'restaurant.roles.permission_groups.management',
    fallback: 'Management',
    permissions: [
      { id: 'reports_access', labelKey: 'restaurant.roles.permissions.view_reports', fallback: 'View reports' },
      { id: 'restaurant_settings', labelKey: 'restaurant.roles.permissions.manage_restaurant_settings', fallback: 'Restaurant settings' },
      { id: 'user_management', labelKey: 'restaurant.roles.permissions.manage_staff', fallback: 'Manage staff' },
      { id: 'role_management', labelKey: 'restaurant.roles.permissions.manage_roles', fallback: 'Manage roles' },
    ]
  },
];

const EMPTY_FORM: RoleData = {
  name: '',
  description: '',
  permissions: [],
  allowedWorkstations: [],
};

export function RolesList() {
  const { t } = useI18nStore()
  const currentUser = useUserStore().getCurrentUser()
  const rolesStore = useRolesStore()

  const roles = rolesStore.getRoles()
  const loading = rolesStore.loading

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState<RoleData>(EMPTY_FORM)
  const [activeTab, setActiveTab] = useState<'roles' | 'assignment'>('roles')

  const isOwner = currentUser?.role === 'Owner'

  // Fetch workstations so the Owner can assign KDS tab access per role
  const { data: workstations = [] } = useSWR<IWorkstation[]>(
    currentUser?.restaurantId ? `/api/workstations?restaurantId=${encodeURIComponent(currentUser.restaurantId)}` : null,
    fetcher, {
    fallbackData: [],
  })

  useEffect(() => {
    if (currentUser?.restaurantId) {
      rolesStore.fetchRoles(currentUser.restaurantId);
    }
  }, [currentUser?.restaurantId])

  const createPredefinedRoles = async () => {
    const predefinedRoles = [
      {
        name: t('profile.roles.roles.waiter'),
        description: t('restaurant.roles.predefined_roles.waiter_desc'),
        permissions: ['menu_access', 'order_management'],
        allowedWorkstations: [],
      },
      {
        name: t('profile.roles.roles.cashier'),
        description: t('restaurant.roles.predefined_roles.cashier_desc'),
        permissions: ['menu_access', 'order_management', 'payment_processing'],
        allowedWorkstations: [],
      },
      {
        name: t('profile.roles.roles.kitchen_staff'),
        description: t('restaurant.roles.predefined_roles.kitchen_staff_desc'),
        permissions: ['kds_access', 'inventory_management'],
        allowedWorkstations: [],
      },
    ];

    if (!currentUser?.restaurantId) {
      toast.error(t('restaurant.toast.create_predefined_roles_error'));
      return;
    }

    try {
      for (const roleData of predefinedRoles) {
        await rolesStore.addRole({ ...roleData, restaurantId: currentUser.restaurantId });
      }
      toast.success(t('restaurant.toast.predefined_roles_created'));
    } catch {
      toast.error(t('restaurant.toast.create_predefined_roles_error'));
    }
  }

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: [...role.permissions],
        allowedWorkstations: [...(role.allowedWorkstations || [])],
      })
    } else {
      setEditingRole(null)
      setFormData(EMPTY_FORM)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingRole(null)
  }

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => {
      const permissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]

      // If kds_access is removed, clear workstation restrictions
      const allowedWorkstations = permissionId === 'kds_access' && prev.permissions.includes('kds_access')
        ? []
        : prev.allowedWorkstations

      return { ...prev, permissions, allowedWorkstations }
    })
  }

  const handleWorkstationToggle = (workstationId: string) => {
    setFormData(prev => {
      const allowedWorkstations = prev.allowedWorkstations.includes(workstationId)
        ? prev.allowedWorkstations.filter(id => id !== workstationId)
        : [...prev.allowedWorkstations, workstationId]
      return { ...prev, allowedWorkstations }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingRole) {
        await rolesStore.updateRole(editingRole.id, formData);
        toast.success(t('restaurant.toast.role_updated'))
      } else {
        if (!currentUser?.restaurantId) {
          toast.error(t('restaurant.toast.save_role_error'));
          return;
        }
        await rolesStore.addRole({ ...formData, restaurantId: currentUser.restaurantId });
        toast.success(t('restaurant.toast.role_created'))
      }
      handleCloseDialog()
    } catch {
      toast.error(t('restaurant.toast.save_role_error'))
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    try {
      await rolesStore.deleteRole(roleId);
      toast.success(t('restaurant.toast.role_deleted'))
    } catch {
      toast.error(t('restaurant.toast.delete_role_error'))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <p>{t('restaurant.roles.loading')}</p>
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="flex justify-center items-center h-32">
        <p>{t('restaurant.roles.access_denied')}</p>
      </div>
    )
  }

  const hasKdsAccess = formData.permissions.includes('kds_access')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">{t('restaurant.roles.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('restaurant.roles.description')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeTab === 'roles' ? 'default' : 'outline'}
            onClick={() => setActiveTab('roles')}
          >
            {t('restaurant.roles.tabs.roles')}
          </Button>
          <Button
            variant={activeTab === 'assignment' ? 'default' : 'outline'}
            onClick={() => setActiveTab('assignment')}
          >
            {t('restaurant.roles.tabs.assignment')}
          </Button>
          {activeTab === 'roles' && (
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              {t('restaurant.roles.add_role')}
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'roles' ? (
        <Card>
          <CardContent className="p-0">
            {/* Mobile view */}
            <div className="md:hidden">
              {roles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('restaurant.roles.no_roles')}
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {roles.map((role) => (
                    <div key={role.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{role.name}</h4>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(role)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteRole(role.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{role.description || '-'}</p>
                      <div>
                        <h5 className="text-sm font-medium mb-2">{t('restaurant.roles.table.permissions')}</h5>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((permission) => (
                            <Badge key={permission} variant="secondary" className="text-xs">
                              {t(`restaurant.roles.permissions.${permission}`)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {role.permissions.includes('kds_access') && role.allowedWorkstations?.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-2">KDS Workstations</h5>
                          <div className="flex flex-wrap gap-1">
                            {role.allowedWorkstations.map((wsId) => {
                              const ws = workstations.find(w => w.id === wsId)
                              return ws ? (
                                <Badge key={wsId} variant="outline" className="text-xs">{ws.name}</Badge>
                              ) : null
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop view */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('restaurant.roles.table.name')}</TableHead>
                    <TableHead>{t('restaurant.roles.table.description')}</TableHead>
                    <TableHead>{t('restaurant.roles.table.permissions')}</TableHead>
                    <TableHead>KDS Workstations</TableHead>
                    <TableHead className="text-right">{t('restaurant.roles.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.description || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((permission) => (
                            <Badge key={permission} variant="secondary">
                              {t(`restaurant.roles.permissions.${permission}`)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {role.permissions.includes('kds_access') ? (
                          role.allowedWorkstations?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {role.allowedWorkstations.map((wsId) => {
                                const ws = workstations.find(w => w.id === wsId)
                                return ws ? (
                                  <Badge key={wsId} variant="outline">{ws.name}</Badge>
                                ) : null
                              })}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">All</span>
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(role)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteRole(role.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {roles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {t('restaurant.roles.no_roles')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <UsersList />
          </CardContent>
        </Card>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? t('restaurant.roles.dialog.edit_title') : t('restaurant.roles.dialog.add_title')}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? t('restaurant.roles.dialog.edit_description')
                : t('restaurant.roles.dialog.add_description')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="grid gap-4 py-4">
                {/* Name */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    {t('restaurant.roles.dialog.name')}
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>

                {/* Description */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    {t('restaurant.roles.dialog.description')}
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>

                {/* Permissions — grouped */}
                <div className="col-span-4 space-y-4">
                  <Label>{t('restaurant.roles.dialog.permissions')}</Label>
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.fallback} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t(group.labelKey) || group.fallback}
                      </p>
                      {group.permissions.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2 pl-2">
                          <Checkbox
                            id={option.id}
                            checked={formData.permissions.includes(option.id)}
                            onCheckedChange={() => handlePermissionToggle(option.id)}
                          />
                          <label
                            htmlFor={option.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {t(option.labelKey) || option.fallback}
                          </label>
                        </div>
                      ))}

                      {/* KDS workstation selector — only when kds_access is checked */}
                      {group.fallback === 'Kitchen' && hasKdsAccess && workstations.length > 0 && (
                        <div className="pl-6 pt-1 space-y-2 border-l-2 border-muted ml-2">
                          <p className="text-xs text-muted-foreground font-medium">
                            KDS workstation access
                            <span className="ml-1 font-normal">(leave all unchecked to allow all)</span>
                          </p>
                          {workstations.map((ws) => (
                            <div key={ws.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`ws-${ws.id}`}
                                checked={formData.allowedWorkstations.includes(ws.id)}
                                onCheckedChange={() => handleWorkstationToggle(ws.id)}
                              />
                              <label
                                htmlFor={`ws-${ws.id}`}
                                className="text-sm leading-none"
                              >
                                {ws.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="mt-4">
              <Button type="submit">
                {editingRole
                  ? t('restaurant.roles.dialog.update_role')
                  : t('restaurant.roles.dialog.create_role')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
