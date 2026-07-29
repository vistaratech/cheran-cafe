"use client"
import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useI18nStore } from '@/lib/stores/i18n-store'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/helpers'

interface DeleteConfirmationDialogProps {
  children: React.ReactNode;
  count: number;
  onConfirm: () => void;
}

export function DeleteConfirmationDialog({ children, count, onConfirm }: DeleteConfirmationDialogProps) {
    const { t } = useI18nStore();
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild {...({} as any)}>
                <div>{children}</div>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle {...({} as any)}>{t('restaurant.delete_dialog.title', { count })}</AlertDialogTitle>
                    <AlertDialogDescription {...({} as any)}>
                        {t('restaurant.delete_dialog.desc')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel {...({} as any)}>{t('dialog.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        className={cn(buttonVariants({ variant: "destructive" }))}
                        onClick={onConfirm}
                        {...({} as any)}
                    >
                        {t('restaurant.delete_dialog.confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}