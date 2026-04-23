// backend/services/stripe.service.js
// Gestión de suscripciones y pagos

import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const plans = {
  basic: {
    id: 'price_basic',
    name: 'Basic',
    price: 49,
    features: [
      'Hasta 10 proyectos',
      'Simulación básica',
      'Reportes PDF',
      'Soporte por email'
    ],
    limits: {
      maxProjects: 10,
      maxSimulationsPerDay: 5,
      femNodes: 5000
    }
  },
  pro: {
    id: 'price_pro',
    name: 'Pro',
    price: 149,
    features: [
      'Proyectos ilimitados',
      'FEM avanzado',
      'AI Designer',
      'Optimización NSGA-II',
      'Export DXF',
      'Soporte prioritario'
    ],
    limits: {
      maxProjects: -1,
      maxSimulationsPerDay: 50,
      femNodes: 50000
    }
  },
  enterprise: {
    id: 'price_enterprise',
    name: 'Enterprise',
    price: 499,
    features: [
      'Todo lo de Pro',
      'Multiusuario',
      'API dedicada',
      'GPU acceleration',
      'SLA 99.9%',
      'Soporte 24/7'
    ],
    limits: {
      maxProjects: -1,
      maxSimulationsPerDay: -1,
      femNodes: 200000
    }
  }
};

class BillingService {
  async createCustomer(user) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.id
      }
    });
    
    return customer;
  }
  
  async createSubscription(customerId, priceId) {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });
    
    return subscription;
  }
  
  async cancelSubscription(subscriptionId) {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  }
  
  async getSubscription(customerId) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'active'
    });
    
    return subscriptions.data[0] || null;
  }
  
  async checkUsage(userId, plan) {
    const limits = plans[plan].limits;
    
    // Verificar límites de uso
    const projectCount = await this.getProjectCount(userId);
    const simulationCount = await this.getSimulationCount(userId);
    
    return {
      withinLimits: 
        (limits.maxProjects === -1 || projectCount < limits.maxProjects) &&
        (limits.maxSimulationsPerDay === -1 || simulationCount < limits.maxSimulationsPerDay),
      projectCount,
      simulationCount,
      limits
    };
  }
  
  async getProjectCount(userId) {
    // Implementar contador de proyectos
    return 5; // Placeholder
  }
  
  async getSimulationCount(userId) {
    // Implementar contador de simulaciones
    return 3; // Placeholder
  }
  
  getPlan(planName) {
    return plans[planName];
  }
  
  getAllPlans() {
    return Object.values(plans);
  }
}

export default new BillingService();
