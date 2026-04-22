import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, userId: string) {
    return this.prisma.project.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.project.findFirst({
      where: { id, userId },
    });
  }

  async update(id: string, data: any, userId: string) {
    return this.prisma.project.update({
      where: { id, userId },
      data,
    });
  }

  async remove(id: string, userId: string) {
    return this.prisma.project.delete({
      where: { id, userId },
    });
  }
}
