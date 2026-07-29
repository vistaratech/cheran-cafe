"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ArrowRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface PaymentSuccessProps {
  transactionId?: string
  clientTransactionId?: string
  reference?: string
  amount?: string
}

export function PaymentSuccess({ transactionId, clientTransactionId, reference, amount }: PaymentSuccessProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (countdown === 0) { router.push('/profile?payment=success'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

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
                ₹{(parseFloat(amount) / 100).toFixed(2)}
              </span>
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
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Ahora tienes acceso a todas las funcionalidades Pro:
          </p>
          <ul className="text-sm text-green-700 space-y-1">
            {['Reportes avanzados', 'KDS ilimitado', 'Soporte prioritario'].map(f => (
              <li key={f} className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />{f}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-3 pt-4">
        {countdown > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>Redirigiendo en {countdown} segundo{countdown > 1 ? 's' : ''}...</span>
          </div>
        )}
        <Button
          onClick={() => router.push('/profile?payment=success')}
          className="w-full"
        >
          Volver al Perfil
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
