// src/engine/standards/ComplianceReport.js
// Generador de reportes de cumplimiento normativo

export class ComplianceReport {
  constructor(validation, project) {
    this.validation = validation;
    this.project = project;
  }

  /**
   * Genera reporte en formato HTML
   */
  toHTML() {
    if (!this.validation || !this.project) {
      return '<html><body><h1>Error: Datos de validación inválidos</h1></body></html>';
    }
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte de Cumplimiento Normativo</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .status-approved { color: green; font-weight: bold; }
          .status-rejected { color: red; font-weight: bold; }
          .status-warning { color: orange; font-weight: bold; }
          .violation-critical { background: #ffebee; border-left: 4px solid red; padding: 10px; margin: 10px 0; }
          .violation-high { background: #fff3e0; border-left: 4px solid orange; padding: 10px; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reporte de Cumplimiento Normativo</h1>
          <h2>${this.project.name || 'Proyecto de Puesta a Tierra'}</h2>
          <p>Fecha: ${new Date().toLocaleDateString('es-MX')}</p>
          <p>Ingeniero: ${this.project.engineerName || 'No especificado'}</p>
        </div>
        
        <div class="status-${this.getStatusClass()}">
          <h2>Estado Global: ${this.validation.summary?.status || 'UNKNOWN'}</h2>
          <p>${this.validation.summary?.message || 'Sin información'}</p>
        </div>
        
        ${this.renderStandards()}
        
        ${this.renderRecommendations()}
        
        <div class="footer">
          <hr>
          <p>Este reporte fue generado automáticamente por Grounding Designer Pro</p>
          <p>Las normas aplicadas: NOM-001-SEDE-2012, CFE 01J00-01, IEEE 80-2013</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Renderiza cada estándar
   */
  renderStandards() {
    if (!this.validation?.standards) return '';
    
    let html = '';
    for (const [name, standard] of Object.entries(this.validation.standards)) {
      if (!standard) continue;
      html += `
        <h2>${standard.standard || name} - ${standard.title || 'N/A'}</h2>
        <div class="${standard.compliant ? 'status-approved' : 'status-rejected'}">
          Estado: ${standard.compliant ? '✓ CUMPLE' : '✗ NO CUMPLE'}
        </div>
        ${this.renderViolations(standard.violations)}
        ${this.renderMetrics(standard.metrics)}
      `;
    }
    return html;
  }

  /**
   * Renderiza violaciones
   */
  renderViolations(violations) {
    if (!violations || !Array.isArray(violations) || violations.length === 0) {
      return '<p>✅ No se encontraron violaciones</p>';
    }
    
    let html = '<h3>Violaciones Detectadas</h3>';
    for (const v of violations) {
      html += `
        <div class="violation-${v.severity?.toLowerCase() || 'high'}">
          <strong>${v.type || v.title || 'N/A'}</strong><br>
          ${v.message || v.description || 'Sin descripción'}<br>
          <small>Norma: ${v.standard || 'N/A'} - Sección: ${v.section || 'N/A'}</small>
        </div>
      `;
    }
    return html;
  }

  /**
   * Renderiza métricas
   */
  renderMetrics(metrics) {
    if (!metrics) return '';
    
    return `
      <h3>Métricas de Seguridad</h3>
      <table>
        <tr><th>Métrica</th><th>Valor</th><th>Límite</th><th>Estado</th></tr>
        ${metrics.touchVoltage ? `
          <tr>
            <td>Tensión de Contacto</td>
            <td>${metrics.touchVoltage.value?.toFixed(0)} V</td>
            <td>${metrics.touchVoltage.limit?.toFixed(0)} V</td>
            <td>${metrics.touchVoltage.safe ? '✓' : '✗'}</td>
          </tr>
        ` : ''}
        ${metrics.stepVoltage ? `
          <tr>
            <td>Tensión de Paso</td>
            <td>${metrics.stepVoltage.value?.toFixed(0)} V</td>
            <td>${metrics.stepVoltage.limit?.toFixed(0)} V</td>
            <td>${metrics.stepVoltage.safe ? '✓' : '✗'}</td>
          </tr>
        ` : ''}
        ${metrics.groundResistance ? `
          <tr>
            <td>Resistencia de Malla</td>
            <td>${metrics.groundResistance.value?.toFixed(2)} Ω</td>
            <td>${metrics.groundResistance.limit} Ω</td>
            <td>${metrics.groundResistance.safe ? '✓' : '✗'}</td>
          </tr>
        ` : ''}
      </table>
    `;
  }

  /**
   * Renderiza recomendaciones
   */
  renderRecommendations() {
    const recs = this.validation?.summary?.recommendations;
    if (!recs || !Array.isArray(recs) || recs.length === 0) return '';
    
    let html = '<h2>Recomendaciones</h2><ul>';
    for (const rec of recs) {
      html += `<li><strong>[${rec.priority || 'MEDIUM'}]</strong> ${rec.standard || 'N/A'}: ${rec.action || 'Sin acción'}</li>`;
    }
    html += '</ul>';
    return html;
  }

  /**
   * Obtiene clase de estado
   */
  getStatusClass() {
    const status = this.validation?.summary?.status;
    if (status === 'APPROVED') return 'approved';
    if (status === 'REJECTED') return 'rejected';
    return 'warning';
  }
}

export default ComplianceReport;
