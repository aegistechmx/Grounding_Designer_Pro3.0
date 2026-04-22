import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    
    return { accessToken: token, user };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    
    return { accessToken: token, user };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
