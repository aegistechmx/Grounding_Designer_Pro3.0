import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get(':projectId')
  async validate(@Param('projectId') projectId: string) {
    return this.complianceService.validateProject(projectId);
  }

  @Post('report/:projectId')
  async generateReport(@Param('projectId') projectId: string, @Req() req) {
    return this.complianceService.generateReport(projectId, req.user.id);
  }
}
