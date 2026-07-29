import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PaymentSuccess } from '@/components/payment/payment-success'
import { PaymentFailed } from '@/components/payment/payment-failed'
import { PaymentPending } from '@/components/payment/payment-pending'
import { PaymentStatusPoll } from '@/components/payment/payment-status-poll'
import { PayphoneEscapeFrame } from '@/components/payment/payphone-escape-frame'
import Subscription from '@/models/Subscription'
import Restaurant from '@/models/Restaurant'
import { initializeDatabase } from '@/lib/database-service'
import debug from 'debug'

const log = debug('chefcito:payphone:thankyou')

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Resultado del Pago | Chefcito',
  description: 'Verifica el estado de tu pago de suscripción Pro',
  robots: 'noindex, nofollow'
}

interface ThankYouPageProps {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined
  }>
}

async function resolvePayment(
  transactionId: string,
  clientTransactionId: string,
  statusCode: string,
  status: string,
  amount: string,
  reference: string,
): Promise<{ statusCode: string; status: string; amount: string; reference: string }> {
  const payphoneToken = process.env.PAYPHONE_TOKEN

  let finalStatusCode = statusCode
  let finalStatus = status
  let finalAmount = amount
  let finalReference = reference

  log('[ResolvePayment] Starting payment resolution for clientTransactionId:', clientTransactionId)

  if (payphoneToken) {
    // Retry logic: try up to 2 times with 1s delay between attempts
    // This handles transient network issues or PayPhone API being slow to respond
    const maxRetries = 2
    let lastError: unknown = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        log(`[ResolvePayment] Calling PayPhone Confirm API (attempt ${attempt}/${maxRetries})...`)

        // AbortController with 5s timeout to prevent hanging fetch
        const abortController = new AbortController()
        const timeoutId = setTimeout(() => abortController.abort(), 5000)

        const confirmResponse = await fetch(
          'https://pay.payphonetodoesposible.com/api/button/V2/Confirm',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${payphoneToken}`,
            },
            body: JSON.stringify({
              clientTxId: clientTransactionId,
              ...(transactionId ? { id: parseInt(transactionId, 10) } : {}),
            }),
            signal: abortController.signal,
          }
        )

        clearTimeout(timeoutId)

        if (confirmResponse.ok) {
          const result = await confirmResponse.json()
          log('[ResolvePayment] Confirm API response:', JSON.stringify(result, null, 2))
          const confirmedCode = result.statusCode != null ? String(result.statusCode) : undefined
          if (confirmedCode === '3' || confirmedCode === '2') {
            finalStatusCode = confirmedCode
            finalStatus = result.status || status
            finalAmount = result.amount?.toString() || amount
            finalReference = result.reference || reference
          } else if (confirmedCode) {
            log('[ResolvePayment] Confirm API returned non-terminal statusCode:', confirmedCode, '— using URL params')
          }
          // Success - break out of retry loop
          break
        } else {
          // Log the error body for debugging - PayPhone may return useful error messages
          const errorBody = await confirmResponse.text().catch(() => 'Could not read error body')
          log('[ResolvePayment] Confirm API failed with status:', confirmResponse.status, 'body:', errorBody)
          lastError = new Error(`Confirm API returned status ${confirmResponse.status}`)
        }
      } catch (err) {
        lastError = err
        log(`[ResolvePayment] Confirm API error (attempt ${attempt}/${maxRetries}):`, err)

        // If not the last attempt, wait 1s before retrying
        if (attempt < maxRetries) {
          log('[ResolvePayment] Waiting 1s before retry...')
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    // If all retries failed, log a final warning
    if (lastError && !finalStatusCode) {
      log('[ResolvePayment] All retry attempts failed. Falling back to URL params only.')
    }
  }

  const resolvedCode = finalStatusCode || statusCode
  log('[ResolvePayment] Resolved code:', resolvedCode, 'for clientTransactionId:', clientTransactionId)

  if (resolvedCode === '3') {
    const subscription = await Subscription.findOne({ clientTransactionId })
    if (subscription && subscription.status !== 'active') {
      const now = new Date()
      const nextBilling = new Date(now)
      nextBilling.setDate(nextBilling.getDate() + 30)
      subscription.status = 'active'
      if (transactionId) subscription.payphoneTransactionId = transactionId
      subscription.startDate = now
      subscription.endDate = nextBilling
      subscription.nextBillingDate = nextBilling
      await Restaurant.findOneAndUpdate({ id: subscription.restaurantId }, { membership: 'pro' })
      await subscription.save()
      log('[ResolvePayment] Suscripción activada para clientTransactionId:', clientTransactionId)
    } else if (subscription?.status === 'active') {
      log('[ResolvePayment] Suscripción ya estaba activa, skip activation (idempotent)')
    }
  } else if (resolvedCode === '2') {
    const subscription = await Subscription.findOne({ clientTransactionId })
    if (subscription && subscription.status !== 'cancelled') {
      subscription.status = 'cancelled'
      subscription.cancelledAt = new Date()
      subscription.cancellationReason = 'Pago cancelado o fallido'
      await subscription.save()
      log('[ResolvePayment] Suscripción marcada como cancelada para clientTransactionId:', clientTransactionId)
    }
  }

  return { statusCode: resolvedCode, status: finalStatus, amount: finalAmount, reference: finalReference }
}

export default async function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const params = await searchParams

  // PayPhone may send `transactionId` or `id` depending on the flow
  const transactionId = (params.transactionId || params.id) as string | undefined
  // PayPhone may send `clientTransactionId` or `clientTxId` depending on the flow
  const clientTransactionId = (params.clientTransactionId || params.clientTxId) as string | undefined
  const status = params.status as string | undefined
  const statusCode = params.statusCode as string | undefined
  const reference = params.reference as string | undefined
  const amount = params.amount as string | undefined

  log('[ThankYou] Page accessed with params:', { transactionId, clientTransactionId, status, statusCode })

  if (!clientTransactionId && !statusCode && !status) {
    log('[ThankYou] No valid payment params found, redirecting to error')
    redirect('/error?message=Solicitud+de+pago+inválida')
  }

  let resolvedStatusCode = statusCode || ''
  let resolvedStatus = status || ''
  let resolvedAmount = amount || ''
  let resolvedReference = reference || ''

  if (clientTransactionId) {
    try {
      await initializeDatabase()
      const result = await resolvePayment(
        transactionId || '',
        clientTransactionId,
        resolvedStatusCode,
        resolvedStatus,
        resolvedAmount,
        resolvedReference,
      )
      resolvedStatusCode = result.statusCode
      resolvedStatus = result.status
      resolvedAmount = result.amount
      resolvedReference = result.reference
    } catch (err) {
      log('[ThankYou] Error processing payment:', err)
      console.error('[ThankYou] Error processing payment:', err)
    }
  }

  log('[ThankYou] Final resolved status:', { resolvedStatusCode, resolvedStatus })

  const paymentStatus = resolvedStatusCode === '3' || resolvedStatus === 'Approved'
    ? 'success'
    : resolvedStatusCode === '2' || resolvedStatus === 'Canceled' || resolvedStatus === 'Error'
      ? 'failed'
      : 'pending'

  const commonProps = {
    transactionId: transactionId || undefined,
    clientTransactionId: clientTransactionId || undefined,
    reference: resolvedReference || undefined,
    amount: resolvedAmount || undefined,
  }

  // If we have a clientTransactionId but no terminal status from server-side resolution,
  // use the client-side polling component as a fallback
  const shouldUsePolling = paymentStatus === 'pending' && clientTransactionId

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <PayphoneEscapeFrame />
      <div className="w-full max-w-lg">
        {shouldUsePolling && (
          <PaymentStatusPoll
            clientTransactionId={clientTransactionId}
            transactionId={transactionId}
            reference={resolvedReference || undefined}
            amount={resolvedAmount || undefined}
            initialStatusCode={resolvedStatusCode || ''}
          />
        )}
        {!shouldUsePolling && paymentStatus === 'success' && <PaymentSuccess {...commonProps} />}
        {!shouldUsePolling && paymentStatus === 'failed' && <PaymentFailed {...commonProps} />}
        {!shouldUsePolling && paymentStatus === 'pending' && <PaymentPending {...commonProps} />}
      </div>
    </main>
  )
}
