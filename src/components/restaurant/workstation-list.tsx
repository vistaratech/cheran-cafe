"use client"

import React, { useState } from 'react'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  ArrowUp,
  ArrowDown,
  Lock,
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
import { type IWorkstation } from '@/models/Workstation'
import { WorkstationDialog } from './workstation-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/helpers'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface WorkstationListProps {
  workstations: IWorkstation[]
  loading: boolean
  error: string | null
  onAdd: (workstation: Partial<IWorkstation> & { name: string }) => Promise<void>
  onUpdate: (id: string, workstation: Partial<IWorkstation> & { name: string }) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onReorder?: (workstations: IWorkstation[]) => void
}

export function WorkstationList({ workstations, loading, error, onAdd, onUpdate, onDelete, onReorder }: WorkstationListProps) {
  const { t } = useI18nStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWorkstation, setEditingWorkstation] = useState<IWorkstation | undefined>(undefined)

  const handleOpenDialog = (workstation?: IWorkstation) => {
    setEditingWorkstation(workstation)
    setIsDialogOpen(true)
  }

  const handleSave = async (workstationData: Partial<IWorkstation> & { name: string }) => {
    try {
      if (editingWorkstation) {
        await onUpdate(editingWorkstation.id, workstationData)
        toast.success(t('restaurant.workstations.updated_success'))
      } else {
        await onAdd(workstationData)
        toast.success(t('restaurant.workstations.created_success'))
      }
    } catch (error: any) {
      toast.error(error.message || t('restaurant.workstations.error'))
    }
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      await onDelete(id)
      toast.success(t('restaurant.workstations.deleted_success', { name }))
    } catch (error: any) {
      toast.error(error.message || t('restaurant.workstations.error'))
    }
  }

  const isLocked = (name: string) => ['Kitchen', 'Ready'].includes(name)

  const moveWorkstation = async (index: number, direction: 'up' | 'down') => {
    const safe = Array.isArray(workstations) ? workstations : []
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= safe.length) return

    const newWorkstations = [...safe]
    const [removed] = newWorkstations.splice(index, 1)
    newWorkstations.splice(targetIndex, 0, removed)

    const positions = newWorkstations.map((ws, i) => ({
      id: ws.id,
      position: i
    }))

    try {
      const response = await fetch('/api/workstations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Failed to update workstation positions')

      if (onReorder) {
        onReorder(Array.isArray(result.data) ? result.data : [])
      }
      toast.success(t('restaurant.workstations.positions_updated'))
    } catch (error: any) {
      toast.error(error.message || t('restaurant.workstations.error'))
      try {
        const refreshResponse = await fetch('/api/workstations')
        const refreshResult = await refreshResponse.json()
        if (refreshResult.success && onReorder) {
          onReorder(Array.isArray(refreshResult.data) ? refreshResult.data : [])
        }
      } catch (_) {}
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <p>{t('restaurant.loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-32">
        <p className="text-red-500">{t('restaurant.workstations.fetch_error')}: {error}</p>
      </div>
    )
  }

  const safeWorkstations = Array.isArray(workstations) ? workstations : []
  const lastIndex = safeWorkstations.length - 1

  return (
    <TooltipProvider>
    <>
      <WorkstationDialog
        workstation={editingWorkstation}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
      />
      
      <div className="p-6">
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">{t('restaurant.workstations.order')}</TableHead>
                <TableHead>{t('restaurant.workstations.name')}</TableHead>
                <TableHead>
                  <span className="sr-only">{t('restaurant.workstations.actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeWorkstations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    <p>{t('restaurant.workstations.no_workstations')}</p>
                  </TableCell>
                </TableRow>
              ) : (
                safeWorkstations.map((workstation, index) => {
                  const locked = isLocked(workstation.name)
                  const canMoveUp = !locked && index > 0 && !isLocked(safeWorkstations[index - 1]?.name)
                  const canMoveDown = !locked && index < lastIndex && !isLocked(safeWorkstations[index + 1]?.name)

                  return (
                    <TableRow key={workstation.id || `ws-${workstation.name}-${workstation.position}`}>
                      <TableCell className="w-24">
                        <div className="flex items-center gap-1">
                          {locked ? (
                            <Lock className="h-5 w-5 text-muted-foreground/50" />
                          ) : (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      disabled={!canMoveUp}
                                      onClick={() => moveWorkstation(index, 'up')}
                                    >
                                      <ArrowUp className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {canMoveUp ? t('restaurant.workstations.move_up') : t('restaurant.workstations.cannot_move_up')}
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      disabled={!canMoveDown}
                                      onClick={() => moveWorkstation(index, 'down')}
                                    >
                                      <ArrowDown className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {canMoveDown ? t('restaurant.workstations.move_down') : t('restaurant.workstations.cannot_move_down')}
                                </TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {workstation.name}
                          {locked && (
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                              {t('restaurant.workstations.default')}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">{t('restaurant.workstations.toggle_menu')}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t('restaurant.workstations.actions')}</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={() => handleOpenDialog(workstation)}>
                                {t('restaurant.workstations.edit')}
                              </DropdownMenuItem>
                              {!locked && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive" 
                                    onSelect={() => handleDelete(workstation.id, workstation.name)}
                                  >
                                    {t('restaurant.workstations.delete')}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
    </TooltipProvider>
  )
}
