import { NextResponse } from 'next/server';
import Subscription from '@/models/Subscription';
import Restaurant from '@/models/Restaurant';
import { initializeDatabase } from '@/lib/database-service';
import debug from 'debug';

const log = debug('chefcito:payphone:init');

/**
 * IMPORTANT: PayPhone does NOT support webhooks.
 *
 * Payment activation relies entirely on:
 * 1. The thank-you page (server-side resolution in /thank-you/page.tsx)
 * 2. The confirm endpoint (POST /api/payphone/confirm) called from client-side poller
 *
 * There is no webhook URL to configure in PayPhone's dashboard.
 */

// POST /api/payphone/init - Create subscription and return PayPhone config securely
export async function POST(request: Request) {
  try {
    await initializeDatabase();

    const body = await request.json();
    const { restaurantId, restaurantName, ownerEmail } = body;

    if (!restaurantId || !restaurantName || !ownerEmail) {
      return NextResponse.json(
        { error: 'restaurantId, restaurantName y ownerEmail son requeridos' },
        { status: 400 }
      );
    }

    // Verify restaurant exists
    const restaurant = await Restaurant.findOne({ id: restaurantId });
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurante no encontrado' },
        { status: 404 }
      );
    }

    const token = process.env.PAYPHONE_TOKEN;
    const storeId = process.env.PAYPHONE_STORE_ID;

    if (!token || !storeId) {
      console.error('[Payphone Init] Credenciales no configuradas en el servidor. Verifica PAYPHONE_TOKEN y PAYPHONE_STORE_ID en .env.local');
      return NextResponse.json(
        { error: 'Servicio de pagos no configurado' },
        { status: 500 }
      );
    }

    // Cancel any previous pending/active subscriptions for this restaurant
    await Subscription.updateMany(
      { restaurantId, status: { $in: ['active', 'pending'] } },
      { status: 'cancelled', cancelledAt: new Date() }
    );

    // Always generate a NEW unique transaction ID — PayPhone rejects duplicates
    const clientTransactionId = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`.substring(0, 50);

    // Create pending subscription record
    await Subscription.create({
      restaurantId,
      plan: 'pro',
      status: 'pending',
      amount: 499,
      currency: 'USD',
      clientTransactionId,
      paymentMethod: 'payphone',
      startDate: new Date(),
    });

    log('[Init] Pending subscription created successfully');

    const reference = `Suscripción Pro - ${restaurantName}`.substring(0, 100);

    log('[Init] Widget config being sent:', JSON.stringify({ token: '***', storeId, clientTransactionId, amount: 499, amountWithoutTax: 499, currency: 'USD', reference, email: ownerEmail, lang: 'es', defaultMethod: 'card', timeZone: -5 }, null, 2));

    return NextResponse.json({
      token,
      storeId,
      clientTransactionId,
      amount: 499,
      amountWithoutTax: 499,
      currency: 'USD',
      reference,
      email: ownerEmail,
      lang: 'es',
      defaultMethod: 'card',
      timeZone: -5,
    });
  } catch (error) {
    log('[Init] Error:', error);
    console.error('[Payphone Init] Error:', error);
    return NextResponse.json(
      { error: 'Error al inicializar pago' },
      { status: 500 }
    );
  }
}
