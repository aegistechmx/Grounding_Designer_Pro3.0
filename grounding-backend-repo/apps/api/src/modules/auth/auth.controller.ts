import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() data: any) {
    return this.authService.register(data);
  }

  @Post('login')
  async login(@Body() data: any) {
    return this.authService.login(data.email, data.password);
  }
}
