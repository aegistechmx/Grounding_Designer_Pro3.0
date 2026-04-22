export class ComplianceEngine {
  validate(results: any, project: any) {
    const { soil, voltageLevel, faultDuration } = project;
    const { Em, Es, Rg } = results;
    
    // Límites NOM-001-SEDE-2012
    const nomTouchLimit = voltageLevel > 1000 ? 50 : 30;
    const nomStepLimit = 150;
    const nomResistanceLimit = voltageLevel > 23000 ? 5 : 10;
    
    // Límites CFE
    const soilFactor = soil.moisture > 0.25 ? 0.8 : 1.2;
    const cfeTouchLimit = 50 * soilFactor;
    const cfeStepLimit = 150 * soilFactor;
    const cfeResistanceLimit = voltageLevel > 50000 ? 2 : voltageLevel > 15000 ? 5 : 10;
    
    // Límites IEEE 80
    const Cs = 1 - (0.09 * (1 - soil.resistivity / soil.surfaceResistivity)) /
               (2 * soil.surfaceDepth + 0.09);
    const ieeeTouchLimit = (1000 + 1.5 * Cs * soil.surfaceResistivity) * (0.157 / Math.sqrt(faultDuration));
    const ieeeStepLimit = (1000 + 6 * Cs * soil.surfaceResistivity) * (0.157 / Math.sqrt(faultDuration));
    
    const nomCompliant = Em <= nomTouchLimit && Es <= nomStepLimit && Rg <= nomResistanceLimit;
    const cfeCompliant = Em <= cfeTouchLimit && Es <= cfeStepLimit && Rg <= cfeResistanceLimit;
    const ieeeCompliant = Em <= ieeeTouchLimit && Es <= ieeeStepLimit;
    
    return {
      ieee80: {
        compliant: ieeeCompliant,
        limits: { touch: ieeeTouchLimit, step: ieeeStepLimit },
        violations: this.getViolations(Em, ieeeTouchLimit, Es, ieeeStepLimit),
      },
      nom001: {
        compliant: nomCompliant,
        limits: { touch: nomTouchLimit, step: nomStepLimit, resistance: nomResistanceLimit },
        violations: this.getViolations(Em, nomTouchLimit, Es, nomStepLimit, Rg, nomResistanceLimit),
      },
      cfe: {
        compliant: cfeCompliant,
        limits: { touch: cfeTouchLimit, step: cfeStepLimit, resistance: cfeResistanceLimit },
        violations: this.getViolations(Em, cfeTouchLimit, Es, cfeStepLimit, Rg, cfeResistanceLimit),
      },
      globalCompliant: nomCompliant && cfeCompliant && ieeeCompliant,
    };
  }
  
  private getViolations(Em: number, touchLimit: number, Es: number, stepLimit: number, Rg?: number, resistanceLimit?: number): string[] {
    const violations = [];
    if (Em > touchLimit) violations.push(`Tensión de contacto excede límite (${Em.toFixed(0)} > ${touchLimit.toFixed(0)} V)`);
    if (Es > stepLimit) violations.push(`Tensión de paso excede límite (${Es.toFixed(0)} > ${stepLimit.toFixed(0)} V)`);
    if (Rg !== undefined && resistanceLimit !== undefined && Rg > resistanceLimit) {
      violations.push(`Resistencia de malla excede límite (${Rg.toFixed(2)} > ${resistanceLimit} Ω)`);
    }
    return violations;
  }
}
