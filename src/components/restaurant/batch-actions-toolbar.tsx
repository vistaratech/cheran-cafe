"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useI18nStore } from '@/lib/stores/i18n-store'
import { DeleteConfirmationDialog } from './delete-confirmation-dialog'

interface BatchActionsToolbarProps {
  selectedCount: number
  onDelete: () => void
}

export function BatchActionsToolbar({ selectedCount, onDelete }: BatchActionsToolbarProps) {
  const { t } = useI18nStore();

  return (
    <div className="flex justify-between items-center bg-muted/50 p-2 rounded-md mb-4 border border-dashed">
        <span className="text-sm font-medium">{t('restaurant.batch_actions.selected', { count: selectedCount })}</span>
        <div className="space-x-2">
            <DeleteConfirmationDialog count={selectedCount} onConfirm={onDelete}>
                <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('restaurant.batch_actions.delete')}
                </Button>
            </DeleteConfirmationDialog>
        </div>
    </div>
  )
}