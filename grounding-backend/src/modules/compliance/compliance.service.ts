// src/modules/compliance/compliance.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class ComplianceService {
  async validate(simulationResult: any, projectData: any): Promise<any> {
    const { touchVoltage, stepVoltage, groundResistance } = simulationResult;
    const { voltageLevel, faultDuration, soilProfile } = projectData;
    
    // Validar NOM-001-SEDE-2012
    const nomLimits = this.getNOMLimits(voltageLevel, faultDuration);
    const nomCompliant = {
      touchVoltage: touchVoltage <= nomLimits.touchVoltage,
      stepVoltage: stepVoltage <= nomLimits.stepVoltage,
      groundResistance: groundResistance <= nomLimits.maxResistance,
    };
    
    // Validar CFE
    const cfeLimits = this.getCFELimits(voltageLevel, soilProfile);
    const cfeCompliant = {
      touchVoltage: touchVoltage <= cfeLimits.touchVoltage,
      stepVoltage: stepVoltage <= cfeLimits.stepVoltage,
      groundResistance: groundResistance <= cfeLimits.maxResistance,
    };
    
    // Validar IEEE 80
    const ieeeLimits = this.getIEEELimits(faultDuration, soilProfile);
    const ieeeCompliant = {
      touchVoltage: touchVoltage <= ieeeLimits.touchVoltage,
      stepVoltage: stepVoltage <= ieeeLimits.stepVoltage,
    };
    
    const globalCompliant = 
      nomCompliant.touchVoltage && nomCompliant.stepVoltage &&
      cfeCompliant.touchVoltage && cfeCompliant.stepVoltage &&
      ieeeCompliant.touchVoltage && ieeeCompliant.stepVoltage;
    
    return {
      ieee80: {
        compliant: ieeeCompliant.touchVoltage && ieeeCompliant.stepVoltage,
        violations: this.getViolations(ieeeCompliant),
        limits: ieeeLimits,
      },
      nom001: {
        compliant: nomCompliant.touchVoltage && nomCompliant.stepVoltage && nomCompliant.groundResistance,
        violations: this.getViolations(nomCompliant),
        limits: nomLimits,
      },
      cfe: {
        compliant: cfeCompliant.touchVoltage && cfeCompliant.stepVoltage && cfeCompliant.groundResistance,
        violations: this.getViolations(cfeCompliant),
        limits: cfeLimits,
      },
      globalCompliant,
      summary: this.generateSummary(nomCompliant, cfeCompliant, ieeeCompliant),
    };
  }

  private getNOMLimits(voltageLevel: number, faultDuration: number): any {
    const baseTouch = voltageLevel > 1000 ? 50 : 30;
    const timeFactor = Math.sqrt(0.5 / faultDuration);
    
    return {
      touchVoltage: Math.min(baseTouch * timeFactor, 100),
      stepVoltage: Math.min(150 * timeFactor, 500),
      maxResistance: voltageLevel > 23000 ? 5 : 10,
    };
  }

  private getCFELimits(voltageLevel: number, soilProfile: any): any {
    const isWetSoil = soilProfile.moisture > 0.25;
    const safetyFactor = isWetSoil ? 0.8 : 1.2;
    
    return {
      touchVoltage: 50 * safetyFactor,
      stepVoltage: 150 * safetyFactor,
      maxResistance: voltageLevel > 50000 ? 2 : voltageLevel > 15000 ? 5 : 10,
    };
  }

  private getIEEELimits(faultDuration: number, soilProfile: any): any {
    const Cs = 1 - (0.09 * (1 - soilProfile.resistivity / soilProfile.surfaceResistivity)) /
               (2 * soilProfile.surfaceDepth + 0.09);
    const k70 = 0.157;
    
    return {
      touchVoltage: (1000 + 1.5 * Cs * soilProfile.surfaceResistivity) * (k70 / Math.sqrt(faultDuration)),
      stepVoltage: (1000 + 6 * Cs * soilProfile.surfaceResistivity) * (k70 / Math.sqrt(faultDuration)),
    };
  }

  private getViolations(compliant: any): string[] {
    const violations = [];
    if (!compliant.touchVoltage) violations.push('Tensión de contacto excede límite');
    if (!compliant.stepVoltage) violations.push('Tensión de paso excede límite');
    if (compliant.groundResistance !== undefined && !compliant.groundResistance) {
      violations.push('Resistencia de malla excede límite');
    }
    return violations;
  }

  private generateSummary(nom: any, cfe: any, ieee: any): any {
    const allCompliant = nom.touchVoltage && nom.stepVoltage && 
                         cfe.touchVoltage && cfe.stepVoltage &&
                         ieee.touchVoltage && ieee.stepVoltage;
    
    return {
      status: allCompliant ? 'APPROVED' : 'REQUIRES_IMPROVEMENT',
      message: allCompliant 
        ? 'Diseño cumple con todas las normas aplicables'
        : 'Diseño requiere mejoras para cumplir normas',
    };
  }
}
