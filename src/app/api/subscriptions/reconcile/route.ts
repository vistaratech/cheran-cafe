import { NextResponse } from 'next/server';
import Subscription from '@/models/Subscription';
import Restaurant from '@/models/Restaurant';
import { initializeDatabase } from '@/lib/database-service';
import debug from 'debug';

const log = debug('chefcito:payphone:reconcile');

/**
 * Response structure from PayPhone transaction status API.
 */
interface PayphoneTransactionStatus {
  statusCode?: string;
  status?: string;
  amount?: number;
  clientTransactionId?: string;
  transactionId?: string;
}

/**
 * GET /api/subscriptions/reconcile
 *
 * Finds all pending subscriptions older than 10 minutes and checks their
 * actual payment status via PayPhone's Confirm API. Activates any that
 * were approved but not yet activated.
 *
 * In production, this endpoint should be protected with admin authentication.
 * For development, it's open but logs all actions.
 *
 * TODO: Add admin authentication middleware before deploying to production.
 */
export async function GET(request: Request) {
  try {
    await initializeDatabase();

    log('[Reconcile] Starting reconciliation process...');

    // Find all pending subscriptions older than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const pendingSubscriptions = await Subscription.find({
      status: 'pending',
      createdAt: { $lte: tenMinutesAgo },
    });

    log('[Reconcile] Found', pendingSubscriptions.length, 'pending subscriptions older than 10 minutes');

    const results = {
      total: pendingSubscriptions.length,
      activated: 0,
      cancelled: 0,
      stillPending: 0,
      errors: 0,
      details: [] as any[],
    };

    const payphoneToken = process.env.PAYPHONE_TOKEN;

    for (const subscription of pendingSubscriptions) {
      try {
        log('[Reconcile] Checking subscription:', subscription._id, 'clientTransactionId:', subscription.clientTransactionId);

        // Try to get actual payment status from PayPhone
        let payphoneStatus: PayphoneTransactionStatus | null = null;

        if (payphoneToken) {
          try {
            // Build request body - prefer the actual PayPhone transaction ID if saved
            const confirmBody: Record<string, unknown> = {
              clientTxId: subscription.clientTransactionId,
            };

            if (subscription.payphoneTransactionId) {
              confirmBody.id = parseInt(subscription.payphoneTransactionId, 10);
              log('[Reconcile] Using saved payphoneTransactionId:', subscription.payphoneTransactionId, 'for', subscription.clientTransactionId);
            } else {
              log('[Reconcile] No payphoneTransactionId saved, calling Confirm API with clientTxId only for', subscription.clientTransactionId);
            }

            const confirmResponse = await fetch(
              'https://pay.payphonetodoesposible.com/api/button/V2/Confirm',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${payphoneToken}`,
                },
                body: JSON.stringify(confirmBody),
              }
            );

            if (confirmResponse.ok) {
              payphoneStatus = await confirmResponse.json();
              log('[Reconcile] PayPhone status for', subscription.clientTransactionId, ':', payphoneStatus?.statusCode, '(hadTransactionId:', !!subscription.payphoneTransactionId, ')');
            } else {
              log('[Reconcile] PayPhone Confirm API failed with status:', confirmResponse.status, 'for', subscription.clientTransactionId);
            }
          } catch (err) {
            log('[Reconcile] Error calling PayPhone Confirm API:', err);
          }
        }

        // Determine action based on PayPhone status
        const statusCode = payphoneStatus?.statusCode;

        if (statusCode === '3') {
          // Payment was approved - activate the subscription
          const now = new Date();
          const nextBillingDate = new Date(now);
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

          subscription.status = 'active';
          subscription.startDate = now;
          subscription.endDate = nextBillingDate;
          subscription.nextBillingDate = nextBillingDate;
          if (payphoneStatus?.transactionId) {
            subscription.payphoneTransactionId = payphoneStatus.transactionId;
          }
          await subscription.save();

          // Update restaurant membership
          const restaurant = await Restaurant.findOne({ id: subscription.restaurantId });
          if (restaurant && restaurant.membership !== 'pro') {
            restaurant.membership = 'pro';
            await restaurant.save();
            log('[Reconcile] Restaurant membership updated to pro:', restaurant.id);
          }

          results.activated++;
          results.details.push({
            clientTransactionId: subscription.clientTransactionId,
            action: 'activated',
            previousStatus: 'pending',
            newStatus: 'active',
          });

          log('[Reconcile] Subscription activated:', subscription.clientTransactionId);
        } else if (statusCode === '2') {
          // Payment was cancelled
          subscription.status = 'cancelled';
          subscription.cancelledAt = new Date();
          subscription.cancellationReason = 'Pago cancelado (reconciliación automática)';
          await subscription.save();

          results.cancelled++;
          results.details.push({
            clientTransactionId: subscription.clientTransactionId,
            action: 'cancelled',
            previousStatus: 'pending',
            newStatus: 'cancelled',
          });

          log('[Reconcile] Subscription cancelled:', subscription.clientTransactionId);
        } else {
          // Still pending or unknown status
          results.stillPending++;
          results.details.push({
            clientTransactionId: subscription.clientTransactionId,
            action: 'no_action',
            previousStatus: 'pending',
            payphoneStatusCode: statusCode || 'unknown',
          });

          log('[Reconcile] Subscription still pending or unknown status:', subscription.clientTransactionId, 'statusCode:', statusCode);
        }
      } catch (error) {
        results.errors++;
        results.details.push({
          clientTransactionId: subscription.clientTransactionId,
          action: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        log('[Reconcile] Error processing subscription:', subscription.clientTransactionId, error);
      }
    }

    log('[Reconcile] Reconciliation complete. Results:', JSON.stringify(results, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Reconciliación completada',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log('[Reconcile] Unhandled error:', error);
    console.error('[Subscription Reconcile] Error:', error);
    return NextResponse.json(
      { error: 'Error durante la reconciliación', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
