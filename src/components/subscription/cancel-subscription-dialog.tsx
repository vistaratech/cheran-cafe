"use client"

import React, { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { useI18nStore } from '@/lib/stores/i18n-store'

interface CancelSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason?: string) => void
  isLoading?: boolean
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false
}: CancelSubscriptionDialogProps) {
  const { t } = useI18nStore()
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    onConfirm(reason || undefined)
  }

  const handleCancel = () => {
    setReason('')
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('profile.subscription.cancel_confirm_title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('profile.subscription.cancel_confirm_desc')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <label className="text-sm font-medium mb-2 block">
            {t('profile.subscription.cancel_reason')}
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('profile.subscription.cancel_reason')}
            className="min-h-[80px]"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? t('profile.subscription.cancelling') : t('profile.subscription.cancel_button')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
