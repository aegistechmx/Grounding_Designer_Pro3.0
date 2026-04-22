// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, SubscriptionTier } from '../../database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, firstName: string, lastName: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role: UserRole.ENGINEER,
      subscriptionTier: SubscriptionTier.FREE,
    });
    
    return this.userRepository.save(user);
  }

  async login(email: string, password: string): Promise<{ accessToken: string; user: Partial<User> }> {
    const user = await this.userRepository.findOne({ where: { email } });
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    
    const { passwordHash, ...userWithoutPassword } = user;
    
    return { accessToken, user: userWithoutPassword };
  }

  async validateUser(userId: string): Promise<User> {
    return this.userRepository.findOne({ where: { id: userId } });
  }
}
