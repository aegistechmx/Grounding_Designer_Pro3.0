// src/modules/billing/billing.service.ts
import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, SubscriptionTier } from '../../database/entities/user.entity';

@Injectable()
export class BillingService {
  private stripe: Stripe;
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.stripe = new Stripe(configService.get('stripe.secretKey'), {
      apiVersion: '2023-10-16',
    });
  }

  async createCheckoutSession(userId: string, priceId: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    if (!user.stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: { userId: user.id },
      });
      
      user.stripeCustomerId = customer.id;
      await this.userRepository.save(user);
    }
    
    const session = await this.stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${this.configService.get('FRONTEND_URL')}/billing/success`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/billing/cancel`,
      metadata: { userId: user.id },
    });
    
    return session.url;
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata.userId;
    const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string);
    
    let tier: SubscriptionTier;
    switch (subscription.items.data[0].price.id) {
      case 'price_basic':
        tier = SubscriptionTier.BASIC;
        break;
      case 'price_pro':
        tier = SubscriptionTier.PRO;
        break;
      case 'price_enterprise':
        tier = SubscriptionTier.ENTERPRISE;
        break;
      default:
        tier = SubscriptionTier.FREE;
    }
    
    await this.userRepository.update(userId, {
      subscriptionTier: tier,
      stripeSubscriptionId: subscription.id,
    });
    
    this.logger.log(`Usuario ${userId} actualizado a plan ${tier}`);
  }

  private async handleSubscriptionCancelled(subscription: Stripe.Subscription): Promise<void> {
    const customer = await this.stripe.customers.retrieve(subscription.customer as string);
    if ('metadata' in customer) {
      const userId = customer.metadata.userId;
      await this.userRepository.update(userId, {
        subscriptionTier: SubscriptionTier.FREE,
        stripeSubscriptionId: null,
      });
      this.logger.log(`Suscripción cancelada para usuario ${userId}`);
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customer = await this.stripe.customers.retrieve(invoice.customer as string);
    if ('metadata' in customer) {
      const userId = customer.metadata.userId;
      this.logger.warn(`Pago fallido para usuario ${userId}`);
    }
  }

  getPricingPlans() {
    return {
      free: {
        name: 'Free',
        price: 0,
        features: [
          '1 proyecto',
          'Simulación básica',
          'Reportes PDF limitados',
        ],
      },
      basic: {
        name: 'Basic',
        price: 49,
        priceId: 'price_basic',
        features: [
          'Hasta 10 proyectos',
          'Simulación FEM completa',
          'Reportes PDF ilimitados',
          'Soporte por email',
        ],
      },
      pro: {
        name: 'Pro',
        price: 149,
        priceId: 'price_pro',
        features: [
          'Proyectos ilimitados',
          'FEM avanzado con AI',
          'Optimización NSGA-II',
          'Export DXF / CAD',
          'Soporte prioritario',
          'API acceso',
        ],
      },
      enterprise: {
        name: 'Enterprise',
        price: 499,
        priceId: 'price_enterprise',
        features: [
          'Todo lo de Pro',
          'Multiusuario',
          'GPU acceleration',
          'SLA 99.9%',
          'Soporte 24/7',
          'Deployment dedicado',
        ],
      },
    };
  }
}
