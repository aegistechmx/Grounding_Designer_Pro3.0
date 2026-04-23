/**
 * Stripe Billing Service
 * Handles Stripe integration for SaaS monetization
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const emailService = require('../notification/email.service');

class StripeService {
  constructor() {
    this.plans = {
      free: {
        priceId: process.env.STRIPE_PRICE_FREE,
        name: 'Free',
        amount: 0
      },
      pro: {
        priceId: process.env.STRIPE_PRICE_PRO,
        name: 'Pro',
        amount: 4900 // $49.00 in cents
      },
      enterprise: {
        priceId: process.env.STRIPE_PRICE_ENTERPRISE,
        name: 'Enterprise',
        amount: 19900 // $199.00 in cents
      }
    };
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(userId, plan, userEmail) {
    const planConfig = this.plans[plan];
    
    if (!planConfig) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: planConfig.priceId,
        quantity: 1,
      }],
      customer_email: userEmail,
      success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
      metadata: {
        userId,
        plan
      }
    });

    return session;
  }

  /**
   * Create checkout session for one-time payment (Enterprise)
   */
  async createPaymentSession(userId, plan, userEmail) {
    const planConfig = this.plans[plan];
    
    if (!planConfig) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Grounding Designer Pro - ${planConfig.name} Plan`,
            description: 'Enterprise-grade grounding design platform'
          },
          unit_amount: planConfig.amount
        },
        quantity: 1,
      }],
      customer_email: userEmail,
      success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
      metadata: {
        userId,
        plan
      }
    });

    return session;
  }

  /**
   * Get checkout session
   */
  async getCheckoutSession(sessionId) {
    return await stripe.checkout.sessions.retrieve(sessionId);
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(customerId) {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/settings/billing`
    });

    return session;
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle checkout session completed
   */
  async handleCheckoutCompleted(session) {
    const { userId, plan } = session.metadata;
    
    // Update user plan in database
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'grounding_saas',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    });

    await pool.query(
      'UPDATE users SET plan = $1, stripe_customer_id = $2 WHERE id = $3',
      [plan, session.customer, userId]
    );

    console.log(`User ${userId} upgraded to ${plan} plan`);
  }

  /**
   * Handle subscription created
   */
  async handleSubscriptionCreated(subscription) {
    const customerId = subscription.customer;
    const plan = this.getPlanFromPriceId(subscription.items.data[0].price.id);

    // Update user plan
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'grounding_saas',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    });

    await pool.query(
      'UPDATE users SET plan = $1, stripe_subscription_id = $2 WHERE stripe_customer_id = $3',
      [plan, subscription.id, customerId]
    );
  }

  /**
   * Handle subscription updated
   */
  async handleSubscriptionUpdated(subscription) {
    const customerId = subscription.customer;
    const plan = this.getPlanFromPriceId(subscription.items.data[0].price.id);

    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'grounding_saas',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    });

    await pool.query(
      'UPDATE users SET plan = $1 WHERE stripe_customer_id = $2',
      [plan, customerId]
    );
  }

  /**
   * Handle subscription deleted (canceled)
   */
  async handleSubscriptionDeleted(subscription) {
    const customerId = subscription.customer;

    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'grounding_saas',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    });

    // Downgrade to free plan
    await pool.query(
      'UPDATE users SET plan = $1, stripe_subscription_id = NULL WHERE stripe_customer_id = $2',
      ['free', customerId]
    );
  }

  /**
   * Handle invoice payment succeeded
   */
  async handleInvoicePaymentSucceeded(invoice) {
    const customerId = invoice.customer;
    
    // Update usage tracking
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'grounding_saas',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    });

    // Reset monthly counters
    await pool.query(
      `UPDATE usage_tracking 
       SET simulation_count = 0, pdf_export_count = 0, excel_export_count = 0 
       WHERE user_id = (SELECT id FROM users WHERE stripe_customer_id = $1)`,
      [customerId]
    );

    // Get user email and send payment success notification
    const userResult = await pool.query(
      'SELECT email, plan FROM users WHERE stripe_customer_id = $1',
      [customerId]
    );

    if (userResult.rows.length > 0) {
      const { email, plan } = userResult.rows[0];
      try {
        await emailService.sendPaymentSuccess({
          to: email,
          plan,
          amount: invoice.amount_paid,
          nextBillingDate: invoice.next_payment_attempt || invoice.due_date
        });
      } catch (emailError) {
        console.error('Failed to send payment success email:', emailError);
      }
    }
  }

  /**
   * Handle invoice payment failed
   */
  async handleInvoicePaymentFailed(invoice) {
    const customerId = invoice.customer;
    
    // Get user email and send payment failed notification
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'grounding_saas',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    });

    const userResult = await pool.query(
      'SELECT email FROM users WHERE stripe_customer_id = $1',
      [customerId]
    );

    if (userResult.rows.length > 0) {
      const { email } = userResult.rows[0];
      try {
        await emailService.sendPaymentFailed({
          to: email,
          amount: invoice.amount_due,
          retryDate: invoice.next_payment_attempt
        });
      } catch (emailError) {
        console.error('Failed to send payment failed email:', emailError);
      }
    }
  }

  /**
   * Get plan from price ID
   */
  getPlanFromPriceId(priceId) {
    for (const [plan, config] of Object.entries(this.plans)) {
      if (config.priceId === priceId) {
        return plan;
      }
    }
    return 'free';
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId) {
    return await stripe.subscriptions.cancel(subscriptionId);
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId) {
    return await stripe.subscriptions.retrieve(subscriptionId);
  }
}

module.exports = new StripeService();
