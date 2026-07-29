"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle, ArrowRight, Clock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface PaymentFailedProps {
  transactionId?: string
  clientTransactionId?: string
  reference?: string
}

export function PaymentFailed({ transactionId, clientTransactionId, reference }: PaymentFailedProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (countdown === 0) { router.push('/profile'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  return (
    <Card className="w-full max-w-md mx-auto border-red-200 bg-red-50/50 animate-in fade-in zoom-in duration-500">
      <CardHeader className="text-center space-y-4 pb-2">
        <XCircle className="h-20 w-20 text-red-600 mx-auto animate-in zoom-in duration-300" />
        <div className="space-y-2">
          <CardTitle className="text-3xl font-bold text-red-700">
            Pago Cancelado
          </CardTitle>
          <CardDescription className="text-red-600 text-base">
            No se pudo completar tu pago
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="bg-card rounded-lg p-4 space-y-3 border border-red-200">
          {reference && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Concepto:</span>
              <span className="text-sm font-medium">{reference}</span>
            </div>
          )}
          {transactionId && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Transacción:</span>
              <span className="text-sm font-mono text-xs">{transactionId}</span>
            </div>
          )}
          {clientTransactionId && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">ID Cliente:</span>
              <span className="text-sm font-mono text-xs truncate max-w-[200px]">{clientTransactionId}</span>
            </div>
          )}
        </div>
        <div className="text-center space-y-2 p-4 bg-red-100 rounded-lg">
          <p className="text-sm text-red-800 font-medium">¿Qué puedes hacer?</p>
          <ul className="text-sm text-red-700 space-y-1 text-left">
            {[
              'Verifica que tu tarjeta tenga fondos suficientes',
              'Confirma que los datos de tu tarjeta sean correctos',
              'Intenta con otro método de pago',
            ].map(tip => (
              <li key={tip} className="flex items-start gap-2">
                <span className="text-red-500">•</span>{tip}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-3 pt-4">
        <div className="flex gap-2 w-full">
          <Button
            onClick={() => router.push('/profile?payment=retry')}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
          <Button
            onClick={() => router.push('/profile')}
            variant="destructive"
            className="flex-1"
          >
            Volver al Perfil
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        {countdown > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>Redirigiendo en {countdown} segundo{countdown > 1 ? 's' : ''}...</span>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
