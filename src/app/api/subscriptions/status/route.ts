import { NextResponse } from 'next/server';
import Subscription from '@/models/Subscription';
import { initializeDatabase } from '@/lib/database-service';

/**
 * GET /api/subscriptions/status?clientTransactionId=xxx
 *
 * Returns the current status of a subscription by clientTransactionId.
 * Used by the payment poller on the thank-you page.
 */
export async function GET(request: Request) {
  try {
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const clientTransactionId = searchParams.get('clientTransactionId');

    if (!clientTransactionId) {
      return NextResponse.json(
        { error: 'clientTransactionId es requerido' },
        { status: 400 }
      );
    }

    const subscription = await Subscription.findOne({ clientTransactionId });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada', subscription: null },
        { status: 404 }
      );
    }

    return NextResponse.json({
      subscription: subscription.toObject(),
    });
  } catch (error) {
    console.error('[Subscription Status] Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Error al obtener estado de suscripción' },
      { status: 500 }
    );
  }
}
