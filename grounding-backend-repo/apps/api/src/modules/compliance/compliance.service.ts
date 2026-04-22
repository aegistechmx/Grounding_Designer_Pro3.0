import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ComplianceEngine } from '@compliance';

@Injectable()
export class ComplianceService {
  constructor(private prisma: PrismaService) {
    this.complianceEngine = new ComplianceEngine();
  }

  private complianceEngine: ComplianceEngine;

  async validateProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || !project.simulationResults) {
      throw new Error('Project has no simulation results');
    }

    const compliance = this.complianceEngine.validate(
      project.simulationResults,
      project,
    );

    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        complianceStatus: compliance,
        status: compliance.globalCompliant ? 'compliant' : 'non_compliant',
      },
    });

    return compliance;
  }

  async generateReport(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    const compliance = await this.validateProject(projectId);

    return this.prisma.complianceReport.create({
      data: {
        projectId,
        userId,
        standard: 'IEEE-80',
        compliant: compliance.globalCompliant,
        violations: compliance,
        metrics: project.simulationResults,
      },
    });
  }
}
