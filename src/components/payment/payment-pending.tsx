"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface PaymentPendingProps {
  transactionId?: string
  clientTransactionId?: string
  reference?: string
}

export function PaymentPending({ transactionId, clientTransactionId, reference }: PaymentPendingProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (countdown === 0) { router.push('/profile'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  return (
    <Card className="w-full max-w-md mx-auto border-yellow-200 bg-yellow-50/50 animate-in fade-in zoom-in duration-500">
      <CardHeader className="text-center space-y-4 pb-2">
        <Loader2 className="h-20 w-20 text-yellow-600 mx-auto animate-spin" />
        <div className="space-y-2">
          <CardTitle className="text-3xl font-bold text-yellow-700">
            Procesando Pago
          </CardTitle>
          <CardDescription className="text-yellow-600 text-base">
            Estamos verificando tu pago, por favor espera...
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="bg-card rounded-lg p-4 space-y-3 border border-yellow-200">
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
        <div className="text-center space-y-2 p-4 bg-yellow-100 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-yellow-800">
            <Clock className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium">Verificando con el banco...</span>
          </div>
          <p className="text-xs text-yellow-700">
            Este proceso puede tomar unos segundos. No cierres esta ventana.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-3 pt-4">
        <Button
          onClick={() => router.push('/profile')}
          variant="outline"
          className="w-full"
        >
          Volver al Perfil
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
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
