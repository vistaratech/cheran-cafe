import { NextResponse } from 'next/server';
import Subscription from '@/models/Subscription';
import Restaurant from '@/models/Restaurant';
import { initializeDatabase } from '@/lib/database-service';
import debug from 'debug';

const log = debug('chefcito:payphone:confirm');

/**
 * Request body for the confirm endpoint.
 */
interface ConfirmRequest {
  clientTransactionId: string;
  id?: string; // PayPhone transaction ID (optional - if not provided, omit from request)
}

/**
 * Response from PayPhone Confirm API.
 */
interface PayphoneConfirmResponse {
  statusCode?: string | number;
  status?: string;
  amount?: number;
  reference?: string;
  transactionId?: string;
}

/**
 * POST /api/payphone/confirm
 *
 * Calls PayPhone Confirm API with the ACTUAL transaction ID (not hardcoded 0).
 * This endpoint is called client-side (from thank-you page poller) to activate
 * subscriptions. PayPhone does NOT support webhooks, so this redirect-based
 * flow is the ONLY way to activate subscriptions.
 *
 * CRITICAL: PayPhone reverses transactions automatically if Confirm API is not
 * called within 5 minutes of payment completion.
 *
 * Idempotent: safe to call multiple times with the same data.
 * No authentication required (called from client-side poller).
 */
export async function POST(request: Request) {
  try {
    await initializeDatabase();

    let body: ConfirmRequest;

    try {
      body = await request.json();
    } catch {
      log('[Confirm] Invalid JSON payload received');
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const { clientTransactionId, id } = body;

    // Validate required fields
    if (!clientTransactionId) {
      log('[Confirm] Missing required field: clientTransactionId');
      return NextResponse.json(
        { error: 'clientTransactionId is required' },
        { status: 400 }
      );
    }

    log('[Confirm] Starting confirmation for clientTransactionId:', clientTransactionId, 'id:', id);

    // Find the subscription
    const subscription = await Subscription.findOne({ clientTransactionId });

    if (!subscription) {
      log('[Confirm] Subscription not found for clientTransactionId:', clientTransactionId);
      return NextResponse.json(
        { error: 'Subscription not found', clientTransactionId },
        { status: 404 }
      );
    }

    // Idempotency: if already active, skip calling PayPhone again
    if (subscription.status === 'active') {
      log('[Confirm] Subscription already active, skipping (idempotent)');
      return NextResponse.json({
        status: 'active',
        statusCode: '3',
        message: 'Subscription already active',
      });
    }

    // Idempotency: if already cancelled, skip
    if (subscription.status === 'cancelled') {
      log('[Confirm] Subscription already cancelled, skipping (idempotent)');
      return NextResponse.json({
        status: 'cancelled',
        statusCode: '2',
        message: 'Subscription already cancelled',
      });
    }

    // Call PayPhone Confirm API
    const payphoneToken = process.env.PAYPHONE_TOKEN;

    let payphoneStatus: string | null = null;
    let payphoneStatusCode: string | null = null;
    let payphoneAmount: number | undefined;
    let payphoneReference: string | undefined;
    let payphoneTransactionId: string | undefined;

    if (payphoneToken) {
      try {
        log('[Confirm] Calling PayPhone Confirm API...');

        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 8000);

        // Build request body - only include id if we have the actual PayPhone transaction ID
        const confirmBody: Record<string, unknown> = {
          clientTxId: clientTransactionId,
        };
        if (id) {
          confirmBody.id = parseInt(id, 10);
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
            signal: abortController.signal,
          }
        );

        clearTimeout(timeoutId);

        if (confirmResponse.ok) {
          const result: PayphoneConfirmResponse = await confirmResponse.json();
          log('[Confirm] PayPhone Confirm API response:', JSON.stringify(result, null, 2));

          payphoneStatusCode = result.statusCode != null ? String(result.statusCode) : null;
          payphoneStatus = result.status || null;
          payphoneAmount = result.amount;
          payphoneReference = result.reference;
          payphoneTransactionId = result.transactionId != null ? String(result.transactionId) : undefined;
        } else {
          const errorBody = await confirmResponse.text().catch(() => 'Could not read error body');
          log('[Confirm] PayPhone Confirm API failed with status:', confirmResponse.status, 'body:', errorBody);
        }
      } catch (err) {
        log('[Confirm] Error calling PayPhone Confirm API:', err);
      }
    } else {
      log('[Confirm] PAYPHONE_TOKEN not configured, skipping PayPhone call');
    }

    // If PayPhone didn't respond, return current subscription status
    if (!payphoneStatusCode) {
      log('[Confirm] No response from PayPhone, returning current subscription status:', subscription.status);
      return NextResponse.json({
        status: subscription.status,
        statusCode: null,
        message: 'Could not confirm with PayPhone',
      });
    }

    // Handle approved payment (statusCode = "3")
    if (payphoneStatusCode === '3') {
      const now = new Date();
      const nextBillingDate = new Date(now);
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      // Update subscription
      subscription.status = 'active';
      subscription.startDate = now;
      subscription.endDate = nextBillingDate;
      subscription.nextBillingDate = nextBillingDate;

      // Save the actual PayPhone transaction ID
      if (payphoneTransactionId) {
        subscription.payphoneTransactionId = payphoneTransactionId;
        log('[Confirm] Saved payphoneTransactionId:', payphoneTransactionId);
      } else if (id) {
        // Fallback: use the ID from the request if PayPhone didn't return one
        subscription.payphoneTransactionId = id;
        log('[Confirm] Saved payphoneTransactionId from request:', id);
      }

      await subscription.save();

      // Update restaurant membership to pro
      const restaurant = await Restaurant.findOne({ id: subscription.restaurantId });
      if (restaurant) {
        if (restaurant.membership !== 'pro') {
          restaurant.membership = 'pro';
          await restaurant.save();
          log('[Confirm] Restaurant membership updated to pro:', restaurant.id);
        } else {
          log('[Confirm] Restaurant membership already pro, skipping update');
        }
      } else {
        log('[Confirm] WARNING: Restaurant not found for subscription:', subscription.restaurantId);
      }

      log('[Confirm] Subscription activated:', subscription._id);

      return NextResponse.json({
        status: 'active',
        statusCode: '3',
        amount: payphoneAmount,
        reference: payphoneReference,
      });
    }

    // Handle cancelled payment (statusCode = "2")
    if (payphoneStatusCode === '2') {
      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      subscription.cancellationReason = 'Pago cancelado o fallido';

      if (payphoneTransactionId) {
        subscription.payphoneTransactionId = payphoneTransactionId;
      } else if (id) {
        subscription.payphoneTransactionId = id;
      }

      await subscription.save();

      log('[Confirm] Subscription cancelled:', subscription._id);

      return NextResponse.json({
        status: 'cancelled',
        statusCode: '2',
      });
    }

    // Non-terminal or unknown status
    log('[Confirm] Non-terminal or unknown statusCode from PayPhone:', payphoneStatusCode);

    return NextResponse.json({
      status: subscription.status,
      statusCode: payphoneStatusCode,
      message: 'Payment not yet terminal',
    });
  } catch (error) {
    log('[Confirm] Unhandled error:', error);
    console.error('[Payphone Confirm] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
