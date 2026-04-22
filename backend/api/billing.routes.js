// backend/api/billing.routes.js
// Rutas para facturación y suscripciones

const express = require('express');
const { authenticate } = require('../middleware/auth');
const stripeService = require('../services/stripe.service');

const router = express.Router();

// Obtener planes de suscripción
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: [
          '3 proyectos por mes',
          'Simulaciones básicas',
          'Exportación PDF',
          'Soporte por email'
        ]
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 29,
        currency: 'USD',
        interval: 'month',
        features: [
          'Proyectos ilimitados',
          'Simulaciones avanzadas',
          'Exportación DXF/CAD',
          'Soporte prioritario',
          'API access'
        ]
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Todo lo de Professional',
          'Múltiples usuarios',
          'Simulaciones AI',
          'Integraciones personalizadas',
          'Soporte 24/7'
        ]
      }
    ];
    
    res.json({ plans });
  } catch (error) {
    console.error('Error al obtener planes:', error);
    res.status(500).json({ error: 'Error al obtener planes' });
  }
});

// Crear sesión de checkout de Stripe
router.post('/checkout', authenticate, async (req, res) => {
  try {
    const { planId } = req.body;
    
    if (!planId) {
      return res.status(400).json({ error: 'planId es requerido' });
    }
    
    const checkoutSession = await stripeService.createCheckoutSession(
      req.userId,
      planId
    );
    
    res.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error) {
    console.error('Error al crear sesión de checkout:', error);
    res.status(500).json({ error: 'Error al crear sesión de checkout' });
  }
});

// Obtener estado de suscripción
router.get('/subscription', authenticate, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({
      subscription: {
        tier: user.subscriptionTier,
        status: 'active', // En producción, verificar con Stripe
        renewAt: null // En producción, obtener de Stripe
      }
    });
  } catch (error) {
    console.error('Error al obtener suscripción:', error);
    res.status(500).json({ error: 'Error al obtener suscripción' });
  }
});

// Webhook de Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    
    const event = stripeService.constructWebhookEvent(req.body, sig);
    
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await stripeService.handleSuccessfulPayment(session);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await stripeService.handleSubscriptionChange(event.data.object);
        break;
      default:
        console.log(`Evento no manejado: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(500).json({ error: 'Error en webhook' });
  }
});

module.exports = router;
