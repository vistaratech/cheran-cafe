"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useI18nStore } from '@/lib/stores/i18n-store'
import { SubscriptionCard } from '@/components/subscription/subscription-card'
import { PayphonePaymentBox } from '@/components/subscription/payphone-payment-box'
import { CancelSubscriptionDialog } from '@/components/subscription/cancel-subscription-dialog'
import { useUserStore } from '@/lib/stores/user-store'
import { toast } from 'sonner'

interface Subscription {
  _id: string
  restaurantId: string
  plan: 'free' | 'pro'
  status: 'active' | 'cancelled' | 'expired' | 'pending'
  startDate: string
  endDate?: string
  amount: number
  currency: string
  clientTransactionId?: string
}

export default function ProfilePage() {
  const { t } = useI18nStore()
  const user = useUserStore((state) => state.getCurrentUser())
  const refreshUser = useUserStore((state) => state.refreshUser)

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [restaurantMembership, setRestaurantMembership] = useState<'free' | 'pro'>('free')
  const [restaurantName, setRestaurantName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')

  // Cargar suscripción y membresía del restaurante al montar
  useEffect(() => {
    if (!user?.id || !user?.restaurantId) return

    const loadSubscription = async () => {
      try {
        const response = await fetch(`/api/subscriptions?restaurantId=${user.restaurantId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.hasSubscription && data.subscription) {
            setSubscription(data.subscription)
          }
        }

        // Load restaurant membership and details
        const restaurantResponse = await fetch(`/api/restaurants/${user.restaurantId}`)
        if (restaurantResponse.ok) {
          const restaurantData = await restaurantResponse.json()
          if (restaurantData && !restaurantData.error) {
            setRestaurantMembership(restaurantData.membership || 'free')
            setRestaurantName(restaurantData.name || '')
            setPhone(restaurantData.phone || '')
            setAddress(restaurantData.address || '')
            setCity(restaurantData.city || '')
          }
        }

        // Check if current user is the owner
        setIsOwner(user.role === 'Owner')
      } catch (error) {
        console.error('Error loading subscription:', error)
      }
    }

    loadSubscription()
  }, [user?.id, user?.restaurantId, user?.role])

  // Manejar mensajes de resultado de pago desde la URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')
    const txId = urlParams.get('txId')

    if (paymentStatus) {
      if (paymentStatus === 'success') {
        toast.success(t('profile.subscription.payment_success'))

        // Force a complete refresh of restaurant subscription after payment
        const refreshAfterPayment = async () => {
          await new Promise(resolve => setTimeout(resolve, 500))

          const currentUser = useUserStore.getState().getCurrentUser()
          if (!currentUser?.id || !currentUser?.restaurantId) return

          // 1. Reload subscription directly
          try {
            const subResponse = await fetch(`/api/subscriptions?restaurantId=${currentUser.restaurantId}`)
            if (subResponse.ok) {
              const subData = await subResponse.json()
              if (subData.hasSubscription && subData.subscription) {
                setSubscription(subData.subscription)
              }
            }
          } catch (error) {
            console.error('Error reloading subscription after payment:', error)
          }

          // 2. Reload restaurant membership
          try {
            const restaurantResponse = await fetch(`/api/restaurants/${currentUser.restaurantId}`)
            if (restaurantResponse.ok) {
              const restaurantData = await restaurantResponse.json()
              if (restaurantData && !restaurantData.error) {
                setRestaurantMembership(restaurantData.membership || 'free')
              }
            }
          } catch (error) {
            console.error('Error reloading restaurant membership after payment:', error)
          }

          // 3. Also trigger the store's refreshUser if email is available
          if (currentUser.email) {
            useUserStore.getState().refreshUser(currentUser.email)
          }
        }

        refreshAfterPayment()
      } else if (paymentStatus === 'failed') {
        toast.error(t('profile.subscription.payment_failed'))
      } else if (paymentStatus === 'error') {
        toast.error(t('profile.subscription.payment_error'))
      }
      // Limpiar parámetro de la URL
      window.history.replaceState({}, document.title, '/profile')
    }
  }, [])

  const loadSubscription = async () => {
    if (!user?.restaurantId) return

    try {
      const response = await fetch(`/api/subscriptions?restaurantId=${user.restaurantId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.hasSubscription && data.subscription) {
          setSubscription(data.subscription)
        }
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
    }
  }

  const handleSavePersonalInfo = async () => {
    if (!user?.id) return
    
    try {
      const nameValue = (document.getElementById('name') as HTMLInputElement)?.value
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameValue }),
      })

      if (response.ok) {
        toast.success('Información personal actualizada')
        if (user.email) refreshUser(user.email)
      } else {
        toast.error('Error al actualizar la información')
      }
    } catch (error) {
      console.error('Error saving personal info:', error)
      toast.error('Error al actualizar la información')
    }
  }

  const handleSaveRestaurantInfo = async () => {
    if (!user?.restaurantId) return

    try {
      const response = await fetch(`/api/restaurants/${user.restaurantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: restaurantName,
          phone,
          address,
          city,
        }),
      })

      if (response.ok) {
        toast.success('Información del restaurante actualizada')
      } else {
        toast.error('Error al actualizar la información del restaurante')
      }
    } catch (error) {
      console.error('Error saving restaurant info:', error)
      toast.error('Error al actualizar la información del restaurante')
    }
  }

  const handleSubscribe = () => {
    setIsPaymentDialogOpen(true)
  }

  const handleClosePaymentDialog = () => {
    setIsPaymentDialogOpen(false)
  }

  const handleCancelSubscription = async (reason?: string) => {
    if (!subscription?.clientTransactionId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/subscriptions/${subscription.clientTransactionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })

      if (response.ok) {
        toast.success(t('profile.subscription.cancelled_success'))
        setRestaurantMembership('free')
        setSubscription(null)
        setShowCancelDialog(false)
      } else {
        toast.error(t('profile.subscription.cancel_error'))
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error(t('profile.subscription.cancel_error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('profile.title')}</h1>
        <p className="text-muted-foreground">{t('profile.description')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.personal_info')}</CardTitle>
            <CardDescription>{t('profile.personal_info_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('profile.name')}</Label>
              <Input id="name" defaultValue={user?.name || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('profile.email')}</Label>
              <Input id="email" type="email" defaultValue={user?.email || ''} disabled />
              <p className="text-xs text-muted-foreground">El email no se puede cambiar</p>
            </div>
            
            {/* Restaurant Info - Solo para el dueño */}
            {isOwner && user?.restaurantId && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm font-semibold">Información del Restaurante</Label>
                  <p className="text-xs text-muted-foreground mt-1">Datos públicos de tu restaurante</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurant-name">Nombre del Restaurante</Label>
                  <Input 
                    id="restaurant-name" 
                    value={restaurantName} 
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Ej: Mi Restaurante Sabroso"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+593 99 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input 
                    id="address" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle Principal 123, Ciudad"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input 
                    id="city" 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Guayaquil"
                  />
                </div>
                <Button onClick={handleSaveRestaurantInfo} className="w-full">
                  Guardar Información del Restaurante
                </Button>
              </>
            )}
            
            <Separator />
            <Button onClick={handleSavePersonalInfo} className="w-full">{t('profile.save_button')}</Button>
          </CardContent>
        </Card>

        {/* Sección de Suscripción */}
        <SubscriptionCard
          subscription={subscription}
          currentMembership={restaurantMembership}
          onSubscribe={handleSubscribe}
          onCancel={() => setShowCancelDialog(true)}
          isLoading={isLoading}
          isOwner={isOwner}
        />
      </div>

      <Dialog open={Boolean(isPaymentDialogOpen && user && isOwner)} onOpenChange={(open) => {
        setIsPaymentDialogOpen(open)
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-auto w-[95vw] sm:w-auto">
          <DialogHeader className="p-3 sm:p-4 pb-0">
            <DialogTitle className="font-headline text-2xl">
              {t('profile.subscription.payment_dialog_title') || 'Completar Suscripción Pro'}
            </DialogTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('profile.subscription.payment_dialog_description') || 'Usa el botón de Payphone a continuación para completar tu suscripción de $4.99 USD'}
            </p>
          </DialogHeader>

          <div className="p-4 sm:p-6 space-y-4">
            <PayphonePaymentBox
              ownerEmail={user?.email ?? ''}
              restaurantName={user?.name ?? ''}
              restaurantId={user?.restaurantId ?? ''}
            />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-2 pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                {t('profile.subscription.payment_dialog_note') || 'Serás redirigido para confirmar el pago'}
              </p>
              <Button
                variant="outline"
                onClick={handleClosePaymentDialog}
                disabled={isLoading}
              >
                {t('profile.subscription.cancel_button') || 'Cancelar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>{t('profile.logout')}</CardTitle>
          <CardDescription>{t('profile.logout_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">{t('profile.logout_button')}</Button>
        </CardContent>
      </Card>

      {/* Diálogo de Cancelación de Suscripción */}
      <CancelSubscriptionDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelSubscription}
        isLoading={isLoading}
      />
    </div>
  )
}
