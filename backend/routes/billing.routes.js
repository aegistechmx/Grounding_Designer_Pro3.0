/**
 * Billing Routes
 * API endpoints for Stripe billing integration
 */

import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/auth.js';
import stripeService from '../services/billing/stripe.service.js';
import { getPool } from '../database/pool.js';

const pool = getPool();

/**
 * Create checkout session for subscription
 */
router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { plan } = req.body;

    // Get user email
    const userResult = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userEmail = userResult.rows[0].email;

    // Create checkout session
    const session = await stripeService.createCheckoutSession(userId, plan, userEmail);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create checkout session for one-time payment
 */
router.post('/payment', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { plan } = req.body;

    // Get user email
    const userResult = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userEmail = userResult.rows[0].email;

    // Create payment session
    const session = await stripeService.createPaymentSession(userId, plan, userEmail);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Payment session error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get checkout session status
 */
router.get('/session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripeService.getCheckoutSession(sessionId);

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create customer portal session
 */
router.post('/portal', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's Stripe customer ID
    const userResult = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].stripe_customer_id) {
      return res.status(400).json({ success: false, error: 'No Stripe customer found' });
    }

    const customerId = userResult.rows[0].stripe_customer_id;

    // Create portal session
    const session = await stripeService.createPortalSession(customerId);

    res.json({
      success: true,
      url: session.url
    });
  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Cancel subscription
 */
router.post('/cancel', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's subscription ID
    const userResult = await pool.query(
      'SELECT stripe_subscription_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].stripe_subscription_id) {
      return res.status(400).json({ success: false, error: 'No active subscription found' });
    }

    const subscriptionId = userResult.rows[0].stripe_subscription_id;

    // Cancel subscription
    await stripeService.cancelSubscription(subscriptionId);

    res.json({
      success: true,
      message: 'Subscription canceled successfully'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get subscription details
 */
router.get('/subscription', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's subscription ID
    const userResult = await pool.query(
      'SELECT stripe_subscription_id, plan FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { stripe_subscription_id, plan } = userResult.rows[0];

    if (!stripe_subscription_id) {
      return res.json({
        success: true,
        subscription: null,
        plan
      });
    }

    // Get subscription details from Stripe
    const subscription = await stripeService.getSubscription(stripe_subscription_id);

    res.json({
      success: true,
      subscription,
      plan
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Stripe webhook handler
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ success: false, error: 'Invalid signature' });
  }

  // Handle the event
  await stripeService.handleWebhook(event);

  res.json({ received: true });
});

export default router;
