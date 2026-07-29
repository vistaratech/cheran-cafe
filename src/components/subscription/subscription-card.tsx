"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useI18nStore } from '@/lib/stores/i18n-store'
import { Crown, CheckCircle2, XCircle, Clock, AlertCircle, Sparkles, Zap, Star, Trophy, Gift } from 'lucide-react'

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

interface SubscriptionCardProps {
  subscription: Subscription | null
  currentMembership: 'free' | 'pro'
  onSubscribe: () => void
  onCancel: () => void
  isLoading?: boolean
  isOwner?: boolean
}

export function SubscriptionCard({
  subscription,
  currentMembership,
  onSubscribe,
  onCancel,
  isLoading = false,
  isOwner = false
}: SubscriptionCardProps) {
  const { t } = useI18nStore()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        variant: 'default' as const,
        icon: CheckCircle2,
        label: t('profile.subscription.status_active'),
        className: 'bg-green-500'
      },
      cancelled: {
        variant: 'secondary' as const,
        icon: XCircle,
        label: t('profile.subscription.status_cancelled'),
        className: 'bg-gray-500'
      },
      expired: {
        variant: 'outline' as const,
        icon: AlertCircle,
        label: t('profile.subscription.status_expired'),
        className: 'border-orange-500 text-orange-500'
      },
      pending: {
        variant: 'outline' as const,
        icon: Clock,
        label: t('profile.subscription.status_pending'),
        className: 'border-blue-500 text-blue-500'
      }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isPro = currentMembership === 'pro'
  const hasActiveSubscription = subscription?.status === 'active'

  if (!isPro) {
    // Free plan - Card estilo Discord Nitro (antes de suscribirse)
    return (
      <div
        className="relative group self-start"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated gradient border */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-500 rounded-xl opacity-50 group-hover:opacity-100 blur transition-opacity duration-500 animate-gradient-xy" />
        
        <Card className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-0 overflow-hidden">
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-2 left-2 w-1 h-1 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '0s' }} />
            <div className="absolute top-8 right-4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-12 left-6 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 right-8 w-0.5 h-0.5 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
          </div>

          {/* Spotlight effect */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255, 215, 0, 0.4), transparent 50%)`
            }}
          />

          <CardHeader className="relative pb-3">
            {/* Crown icon with animation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Crown className="w-8 h-8 text-yellow-400 animate-pulse" />
                  <div className="absolute inset-0 w-8 h-8 bg-yellow-400/20 rounded-full blur-md animate-pulse" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                    {t('profile.subscription.title')}
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-sm mt-1">
                    {t('profile.subscription.description')}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-0">
            {/* Price display - Nitro style */}
            <div className="relative bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-4 border border-slate-700/50 backdrop-blur">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x">
                  $4.99
                </span>
                <span className="text-slate-400 text-lg">/mes</span>
              </div>
              <p className="text-slate-400 text-sm mt-2">
                Desbloquea todo el poder de Chefcito Pro
              </p>
            </div>

            {/* Feature highlights - Nitro style */}
            <div className="space-y-3">
              {[
                { icon: Zap, text: 'Reportes avanzados ilimitados', color: 'text-yellow-400' },
                { icon: Trophy, text: 'Gestión completa de inventario', color: 'text-pink-400' },
                { icon: Star, text: 'Soporte prioritario 24/7', color: 'text-purple-400' },
                { icon: Gift, text: 'Funciones exclusivas nuevas', color: 'text-yellow-400' },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:bg-slate-700/50 hover:border-slate-600/50 transition-all duration-200 group/item"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <feature.icon className={`w-5 h-5 ${feature.color} group-hover/item:scale-110 transition-transform`} />
                  <span className="text-slate-300 text-sm">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Subscribe button - Animated Nitro style */}
            <div className="relative pt-2">
              {/* Glow effect behind button */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-500 rounded-xl blur-md opacity-50 group-hover/button:opacity-100 transition-opacity animate-gradient-xy" />
              
              <Button
                className="relative w-full h-14 bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-500 hover:from-yellow-400 hover:via-pink-400 hover:to-purple-400 text-white font-bold text-lg shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-0 group/button overflow-hidden"
                onClick={onSubscribe}
                disabled={isLoading}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/button:translate-x-full transition-transform duration-1000" />
                
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('profile.subscription.processing')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
                    <span>{t('profile.subscription.subscribe_button')}</span>
                    <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Pro plan - Active subscription (elegant premium style)
  return (
    <div
      className="relative group self-start"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glowing border */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-xl opacity-75 blur animate-gradient-xy" />
      
      <Card className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-0 overflow-hidden">
        {/* Spotlight effect */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255, 215, 0, 0.3), transparent 50%)`
          }}
        />

        <CardHeader className="relative pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Crown className="w-8 h-8 text-yellow-400 animate-pulse" />
                <div className="absolute inset-0 w-8 h-8 bg-yellow-400/30 rounded-full blur-md" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  {t('profile.subscription.title')}
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm mt-1">
                  {t('profile.subscription.description')}
                </CardDescription>
              </div>
            </div>
            {subscription && getStatusBadge(subscription.status)}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Pro badge and plan */}
          <div className="relative bg-gradient-to-r from-yellow-500/20 via-pink-500/20 to-purple-500/20 rounded-xl p-4 border border-yellow-500/30 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">{t('profile.subscription.current_plan')}</p>
                <p className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                  {t('profile.subscription.plan_pro')}
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-yellow-500 to-pink-500 text-white px-4 py-2 text-lg font-bold border-0 shadow-lg">
                <Sparkles className="w-4 h-4 mr-1" />
                PRO
              </Badge>
            </div>
          </div>

          {/* Subscription details */}
          {subscription && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">Inicio</p>
                <p className="text-sm font-semibold text-slate-200">{formatDate(subscription.startDate)}</p>
              </div>
              {subscription.endDate && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">Renovación</p>
                  <p className="text-sm font-semibold text-slate-200">{formatDate(subscription.endDate)}</p>
                </div>
              )}
            </div>
          )}

          {/* Pro features */}
          <div className="space-y-2 pt-2">
            <h4 className="font-bold text-sm text-yellow-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {t('profile.subscription.pro_features.title')}
            </h4>
            <div className="grid gap-2">
              {[
                t('profile.subscription.pro_features.feature_1'),
                t('profile.subscription.pro_features.feature_2'),
                t('profile.subscription.pro_features.feature_3'),
                t('profile.subscription.pro_features.feature_4'),
                t('profile.subscription.pro_features.feature_5'),
                t('profile.subscription.pro_features.feature_6')
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/30 p-2 rounded-lg border border-slate-700/30">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Cancel button */}
          {hasActiveSubscription && (
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 hover:text-red-300 transition-all duration-200"
                onClick={onCancel}
                disabled={isLoading}
              >
                {isLoading ? t('profile.subscription.cancelling') : t('profile.subscription.cancel_subscription')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
