"use client"

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, AlertTriangle, CheckCircle, ArrowRight, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PaymentStatusPollProps {
  clientTransactionId: string | undefined
  transactionId: string | undefined
  reference: string | undefined
  amount: string | undefined
  initialStatusCode: string
}

const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes — PayPhone reversal window
const URGENCY_THRESHOLD_MS = 60 * 1000 // 60 seconds — show urgency UI

/**
 * PaymentStatusPoll component
 *
 * Polls the subscription status every 3 seconds for up to 5 minutes (PayPhone reversal window).
 * Every 3rd poll, it also POSTs to /api/payphone/confirm to actively try to activate
 * the subscription via PayPhone Confirm API.
 *
 * Shows a countdown timer with urgency indicator when < 60 seconds remain.
 * PayPhone reverses transactions automatically if Confirm API is not called within 5 minutes.
 */
export function PaymentStatusPoll({
  clientTransactionId,
  transactionId,
  reference,
  amount,
  initialStatusCode,
}: PaymentStatusPollProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'polling' | 'timeout' | 'redirecting' | 'cancelled'>('polling')
  const [elapsed, setElapsed] = useState(0)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const pollCountRef = useRef(0)
  const clientTransactionIdRef = useRef(clientTransactionId)
  const transactionIdRef = useRef(transactionId)
  const routerRef = useRef(router)

  // Keep refs updated to avoid stale closures
  useEffect(() => {
    clientTransactionIdRef.current = clientTransactionId
    transactionIdRef.current = transactionId
    routerRef.current = router
  }, [clientTransactionId, transactionId, router])

  // Stable functions that won't cause re-renders
  const callConfirm = useCallback(async () => {
    const ctId = clientTransactionIdRef.current
    const txId = transactionIdRef.current
    if (!ctId) return { success: false }

    try {
      const response = await fetch('/api/payphone/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientTransactionId: ctId,
          ...(txId ? { id: txId } : {}),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, status: data.status }
      } else {
        const errorData = await response.json().catch(() => ({}))
        setConfirmError(errorData.error || 'Error calling confirm endpoint')
        return { success: false }
      }
    } catch {
      setConfirmError('Network error calling confirm endpoint')
      return { success: false }
    }
  }, [])

  const checkStatus = useCallback(async (): Promise<boolean> => {
    const ctId = clientTransactionIdRef.current
    const r = routerRef.current
    if (!ctId) return false

    try {
      const response = await fetch(`/api/subscriptions/status?clientTransactionId=${encodeURIComponent(ctId)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.subscription) {
          setSubscriptionStatus(data.subscription.status)

          if (data.subscription.status === 'active') {
            setStatus('redirecting')
            setTimeout(() => {
              r.push('/profile?payment=success&txId=' + ctId)
            }, 1000)
            return true
          }

          if (data.subscription.status === 'cancelled') {
            setStatus('cancelled')
            return true
          }
        }
      }
    } catch (error) {
      console.error('[PaymentStatusPoll] Error checking subscription status:', error)
    }

    return false
  }, [])

  useEffect(() => {
    // If we already have a terminal status from server-side, don't poll
    if (initialStatusCode === '3') {
      setStatus('redirecting')
      setTimeout(() => {
        router.push('/profile?payment=success&txId=' + clientTransactionId)
      }, 2000)
      return
    }
    if (initialStatusCode === '2') {
      setStatus('cancelled')
      return
    }

    // If no clientTransactionId, can't poll
    if (!clientTransactionId) {
      setStatus('timeout')
      return
    }

    // Start polling with countdown timer
    const startTime = Date.now()
    let internalPollCount = 0
    let cancelled = false

    const doPoll = async () => {
      if (cancelled) return

      const timeElapsed = Date.now() - startTime
      setElapsed(Math.floor(timeElapsed / 1000))

      const remaining = POLL_TIMEOUT_MS - timeElapsed

      // Time's up — PayPhone would have reversed the transaction
      if (remaining <= 0) {
        setStatus('timeout')
        return
      }

      internalPollCount++
      pollCountRef.current = internalPollCount

      // Every 3rd poll, call the confirm endpoint to actively try to activate
      if (internalPollCount % 3 === 1) {
        const confirmResult = await callConfirm()
        if (cancelled) return

        if (confirmResult.success && confirmResult.status === 'active') {
          setStatus('redirecting')
          setTimeout(() => {
            router.push('/profile?payment=success&txId=' + clientTransactionId)
          }, 1000)
          return
        }
        if (confirmResult.success && confirmResult.status === 'cancelled') {
          setStatus('cancelled')
          return
        }
      }

      // Also check subscription status
      const earlyExit = await checkStatus()
      if (earlyExit || cancelled) return

      // Schedule next poll
      setTimeout(doPoll, POLL_INTERVAL_MS)
    }

    const pollTimeout = setTimeout(doPoll, 0)

    // Also update elapsed time display every second
    const timerInterval = setInterval(() => {
      const timeElapsed = Date.now() - startTime
      setElapsed(Math.floor(timeElapsed / 1000))

      if (timeElapsed >= POLL_TIMEOUT_MS) {
        setStatus('timeout')
        clearInterval(timerInterval)
      }
    }, 1000)

    return () => {
      cancelled = true
      clearTimeout(pollTimeout)
      clearInterval(timerInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientTransactionId, initialStatusCode, router, callConfirm, checkStatus])

  const remainingMs = POLL_TIMEOUT_MS - elapsed * 1000
  const isUrgent = remainingMs > 0 && remainingMs < URGENCY_THRESHOLD_MS
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000))

  if (status === 'redirecting') {
    return (
      <Card className="w-full max-w-md mx-auto border-green-200 bg-green-50/50 animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center space-y-4 pb-2">
          <CheckCircle className="h-20 w-20 text-green-600 mx-auto animate-in zoom-in duration-300" />
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-green-700">
              ¡Pago Exitoso!
            </CardTitle>
            <CardDescription className="text-green-600 text-base">
              Tu suscripción Pro ha sido activada correctamente
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="bg-card rounded-lg p-4 space-y-3 border border-green-200">
            {reference && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Concepto:</span>
                <span className="text-sm font-medium">{reference}</span>
              </div>
            )}
            {amount && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monto:</span>
                <span className="text-sm font-semibold text-green-600">
                  ${(parseFloat(amount) / 100).toFixed(2)} USD
                </span>
              </div>
            )}
            {clientTransactionId && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ID Cliente:</span>
                <span className="text-sm font-mono text-xs truncate max-w-[200px]">{clientTransactionId}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>Redirigiendo a tu perfil...</span>
          </div>
        </CardFooter>
      </Card>
    )
  }

  if (status === 'timeout') {
    return (
      <Card className="w-full max-w-md mx-auto border-yellow-200 bg-yellow-50/50 animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center space-y-4 pb-2">
          <AlertTriangle className="h-20 w-20 text-yellow-600 mx-auto animate-in zoom-in duration-300" />
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-yellow-700">
              Verificando tu Pago
            </CardTitle>
            <CardDescription className="text-yellow-600 text-base">
              Estamos procesando tu pago. Puede tomar unos minutos.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {clientTransactionId && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="text-sm font-medium">ID de Transacción (para soporte):</p>
                  <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                    {clientTransactionId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Si tu pago no se refleja en unos minutos, contacta a soporte con este ID.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
          <div className="text-center space-y-2 p-4 bg-yellow-100 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">¿Qué está pasando?</p>
            <ul className="text-sm text-yellow-700 space-y-1 text-left">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                Tu pago puede estar siendo procesado por el banco
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                La activación automática puede tardar hasta 5 minutos
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                Si no se activa, contacta a soporte con el ID de transacción
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 pt-4">
          <Button onClick={() => router.push('/profile')} className="w-full">
            Ir al Perfil
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
            Verificar de Nuevo
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (status === 'cancelled') {
    return (
      <Card className="w-full max-w-md mx-auto border-red-200 bg-red-50/50 animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center space-y-4 pb-2">
          <AlertTriangle className="h-20 w-20 text-red-600 mx-auto animate-in zoom-in duration-300" />
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-red-700">
              Pago Cancelado
            </CardTitle>
            <CardDescription className="text-red-600 text-base">
              Tu pago fue cancelado o fallido
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {confirmError && (
            <Alert variant="destructive">
              <AlertDescription>{confirmError}</AlertDescription>
            </Alert>
          )}
          <div className="text-center space-y-2 p-4 bg-red-100 rounded-lg">
            <p className="text-sm text-red-800 font-medium">Opciones:</p>
            <ul className="text-sm text-red-700 space-y-1 text-left">
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                Intentar el pago nuevamente
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                Contactar a soporte si se realizó el cobro
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 pt-4">
          <Button onClick={() => window.location.reload()} className="w-full">
            Intentar de Nuevo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button onClick={() => router.push('/profile')} variant="outline" className="w-full">
            Volver al Perfil
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Polling state
  return (
    <Card className={`w-full max-w-md mx-auto animate-in fade-in zoom-in duration-500 ${
      isUrgent ? 'border-red-300 bg-red-50/50' : 'border-yellow-200 bg-yellow-50/50'
    }`}>
      <CardHeader className="text-center space-y-4 pb-2">
        {isUrgent ? (
          <Timer className="h-20 w-20 text-red-600 mx-auto animate-pulse" />
        ) : (
          <Clock className="h-20 w-20 text-yellow-600 mx-auto animate-pulse" />
        )}
        <div className="space-y-2">
          <CardTitle className={`text-3xl font-bold ${isUrgent ? 'text-red-700' : 'text-yellow-700'}`}>
            {isUrgent ? '¡Tiempo Limitado!' : 'Verificando Pago'}
          </CardTitle>
          <CardDescription className={isUrgent ? 'text-red-600 text-base' : 'text-yellow-600 text-base'}>
            {isUrgent
              ? 'PayPhone reversará el pago pronto'
              : 'Confirmando tu suscripción Pro...'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="bg-card rounded-lg p-4 space-y-3 border border-current/10">
          {reference && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Concepto:</span>
              <span className="text-sm font-medium">{reference}</span>
            </div>
          )}
          {amount && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Monto:</span>
              <span className={`text-sm font-semibold ${isUrgent ? 'text-red-600' : 'text-yellow-600'}`}>
                ${(parseFloat(amount) / 100).toFixed(2)} USD
              </span>
            </div>
          )}
          {clientTransactionId && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">ID Cliente:</span>
              <span className="text-sm font-mono text-xs truncate max-w-[200px]">{clientTransactionId}</span>
            </div>
          )}
        </div>
        <div className={`flex items-center justify-center gap-3 p-4 rounded-lg ${
          isUrgent ? 'bg-red-100' : 'bg-yellow-100'
        }`}>
          <Clock className={`h-5 w-5 ${isUrgent ? 'animate-spin text-red-700' : 'animate-spin text-yellow-700'}`} />
          <div className="text-center">
            <p className={`text-sm font-medium ${isUrgent ? 'text-red-800' : 'text-yellow-800'}`}>
              {isUrgent ? '¡Confirmando con urgencia!' : 'Verificando con el servidor...'}
            </p>
            <p className={`text-xs mt-1 ${
              isUrgent ? 'text-red-700 font-bold' : 'text-yellow-700'
            }`}>
              {elapsed}s transcurridos · {remainingSeconds}s restantes ({pollCountRef.current} intentos)
            </p>
            {subscriptionStatus && (
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                Estado actual: {subscriptionStatus}
              </p>
            )}
          </div>
        </div>
        {confirmError && (
          <Alert variant="destructive">
            <AlertDescription>{confirmError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-3 pt-4">
        <Button onClick={() => router.push('/profile')} variant="outline" className="w-full">
          Ir al Perfil (puede mostrar estado antiguo)
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
