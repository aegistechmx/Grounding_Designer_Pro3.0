import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body() data: any, @Req() req) {
    return this.projectsService.create(data, req.user.id);
  }

  @Get()
  async findAll(@Req() req) {
    return this.projectsService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    return this.projectsService.findOne(id, req.user.id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any, @Req() req) {
    return this.projectsService.update(id, data, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.projectsService.remove(id, req.user.id);
  }
}
