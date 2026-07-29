import { NextResponse } from 'next/server';
import Subscription from '@/models/Subscription';
import Restaurant from '@/models/Restaurant';
import { initializeDatabase } from '@/lib/database-service';

// PUT /api/subscriptions/[id] - Actualizar suscripción (activar después de pago)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    const { status, plan, payphoneTransactionId, cancellationReason, clientTransactionId } = body;

    // Buscar suscripción por clientTransactionId o _id
    let subscription = await Subscription.findOne({ 
      $or: [{ clientTransactionId: id }, { _id: id }] 
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar estado si se proporciona
    if (status) {
      subscription.status = status;
    }

    // Actualizar plan si se proporciona
    if (plan) {
      subscription.plan = plan;
    }

    // Actualizar ID de transacción de Payphone
    if (payphoneTransactionId) {
      subscription.payphoneTransactionId = payphoneTransactionId;
    }

    // Actualizar clientTransactionId si se proporciona
    if (clientTransactionId) {
      subscription.clientTransactionId = clientTransactionId;
    }

    // Manejar cancelación
    if (status === 'cancelled') {
      subscription.cancelledAt = new Date();
      subscription.cancellationReason = cancellationReason || 'Cancelado por el usuario';

      // Actualizar membresía del restaurante a 'free'
      await Restaurant.findOneAndUpdate(
        { id: subscription.restaurantId },
        { membership: 'free' }
      );
    }

    // Manejar activación
    if (status === 'active') {
      subscription.startDate = new Date();

      // Actualizar membresía del restaurante a 'pro'
      await Restaurant.findOneAndUpdate(
        { id: subscription.restaurantId },
        { membership: 'pro' }
      );
    }

    await subscription.save();

    return NextResponse.json({
      success: true,
      subscription: subscription.toObject()
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Error al actualizar suscripción' },
      { status: 500 }
    );
  }
}

// DELETE /api/subscriptions/[id] - Cancelar suscripción
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { reason } = body || {};

    // Buscar suscripción
    const subscription = await Subscription.findOne({ 
      clientTransactionId: id,
      status: 'active'
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Suscripción activa no encontrada' },
        { status: 404 }
      );
    }

    // Cancelar suscripción
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = reason || 'Cancelado por el usuario';
    await subscription.save();

    // Actualizar membresía del restaurante a 'free'
    await Restaurant.findOneAndUpdate(
      { id: subscription.restaurantId },
      { membership: 'free' }
    );

    return NextResponse.json({
      success: true,
      message: 'Suscripción cancelada exitosamente'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Error al cancelar suscripción' },
      { status: 500 }
    );
  }
}
