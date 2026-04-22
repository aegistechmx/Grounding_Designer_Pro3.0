import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('create-checkout')
  async createCheckout(@Body() data: any, @Req() req) {
    return this.billingService.createCheckoutSession(req.user.id, data.plan);
  }

  @Get('subscription')
  async getSubscription(@Req() req) {
    return this.billingService.getSubscription(req.user.id);
  }
}
