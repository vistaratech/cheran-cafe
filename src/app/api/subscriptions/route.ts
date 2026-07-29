import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import Subscription from '@/models/Subscription';
import Restaurant from '@/models/Restaurant';
import { initializeDatabase } from '@/lib/database-service';

// GET /api/subscriptions - Obtener suscripción del restaurante
export async function GET(request: Request) {
  try {
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID es requerido' },
        { status: 400 }
      );
    }

    // Buscar suscripciones activas o pendientes del restaurante
    const subscription = await Subscription.findOne({
      restaurantId,
      status: { $in: ['active', 'pending'] }
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null
      });
    }

    return NextResponse.json({
      hasSubscription: true,
      subscription: subscription.toObject()
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Error al obtener suscripción' },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions - Crear nueva suscripción
export async function POST(request: Request) {
  try {
    console.log('[Subscription API] Iniciando creación de suscripción...')
    await initializeDatabase()
    console.log('[Subscription API] Conexión a MongoDB establecida')

    const body = await request.json()
    const { restaurantId, plan, amount, clientTransactionId, payphoneTransactionId } = body

    console.log('[Subscription API] Datos recibidos:', { restaurantId, plan, amount, clientTransactionId })

    if (!restaurantId || !plan || !amount) {
      console.error('[Subscription API] Faltan datos requeridos')
      return NextResponse.json(
        { error: 'restaurantId, plan y amount son requeridos' },
        { status: 400 }
      )
    }

    // Validar plan
    if (!['free', 'pro'].includes(plan)) {
      return NextResponse.json(
        { error: 'Plan inválido' },
        { status: 400 }
      )
    }

    // Verificar si el restaurante existe
    const restaurant = await Restaurant.findOne({ id: restaurantId })
    console.log('[Subscription API] Restaurante encontrado:', restaurant ? 'Sí' : 'No')

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurante no encontrado' },
        { status: 404 }
      )
    }

    // Cancelar suscripciones activas previas
    await Subscription.updateMany(
      { restaurantId, status: { $in: ['active', 'pending'] } },
      { status: 'cancelled', cancelledAt: new Date() }
    )

    // Crear nueva suscripción
    console.log('[Subscription API] Creando suscripción...')
    const subscription = await Subscription.create({
      restaurantId,
      plan,
      status: 'pending',
      amount,
      currency: 'USD',
      clientTransactionId,
      payphoneTransactionId: payphoneTransactionId || null,
      startDate: new Date()
    })
    console.log('[Subscription API] Suscripción creada:', subscription._id)

    return NextResponse.json({
      success: true,
      subscription: subscription.toObject()
    }, { status: 201 })
  } catch (error) {
    console.error('[Subscription API] Error detallado:', error)
    console.error('[Subscription API] Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('[Subscription API] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { error: 'Error al crear suscripción', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
