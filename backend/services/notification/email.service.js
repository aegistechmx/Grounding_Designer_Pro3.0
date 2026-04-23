/**
 * Email Notification Service
 * Handles email notifications using Resend (or SendGrid)
 */

const resend = require('resend');

class EmailService {
  constructor() {
    this.resend = resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@groundingdesignerpro.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Grounding Designer Pro';
  }

  /**
   * Send email
   */
  async sendEmail({ to, subject, html, text }) {
    try {
      const data = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to,
        subject,
        html,
        text
      });

      return { success: true, data };
    } catch (error) {
      console.error('Email send error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send PDF ready notification
   */
  async sendPDFReady({ to, projectName, pdfUrl, jobId }) {
    const subject = `Tu reporte PDF está listo - ${projectName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Tu reporte PDF está listo</h2>
        <p>El reporte PDF para el proyecto <strong>${projectName}</strong> ha sido generado exitosamente.</p>
        <p>Puedes descargarlo desde el siguiente enlace:</p>
        <a href="${pdfUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Descargar PDF</a>
        <p style="color: #6b7280; font-size: 14px;">ID del trabajo: ${jobId}</p>
        <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este reporte, puedes ignorar este correo.</p>
      </div>
    `;

    return await this.sendEmail({ to, subject, html });
  }

  /**
   * Send simulation complete notification
   */
  async sendSimulationComplete({ to, projectName, simulationType, resultsUrl, jobId }) {
    const subject = `Simulación completada - ${projectName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Simulación completada</h2>
        <p>La simulación <strong>${simulationType}</strong> para el proyecto <strong>${projectName}</strong> ha finalizado.</p>
        <p>Resultados:</p>
        <a href="${resultsUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Ver Resultados</a>
        <p style="color: #6b7280; font-size: 14px;">ID del trabajo: ${jobId}</p>
      </div>
    `;

    return await this.sendEmail({ to, subject, html });
  }

  /**
   * Send payment success notification
   */
  async sendPaymentSuccess({ to, plan, amount, nextBillingDate }) {
    const subject = `Pago exitoso - Plan ${plan}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">¡Pago exitoso!</h2>
        <p>Tu suscripción al plan <strong>${plan}</strong> ha sido activada.</p>
        <p><strong>Monto:</strong> $${amount / 100} USD</p>
        <p><strong>Próximo cobro:</strong> ${new Date(nextBillingDate).toLocaleDateString()}</p>
        <p>Ya puedes disfrutar de todas las características de tu plan.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Ir al Dashboard</a>
      </div>
    `;

    return await this.sendEmail({ to, subject, html });
  }

  /**
   * Send payment failed notification
   */
  async sendPaymentFailed({ to, amount, retryDate }) {
    const subject = 'Pago fallido - Acción requerida';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Pago fallido</h2>
        <p>No pudimos procesar tu pago de <strong>$${amount / 100} USD</strong>.</p>
        <p>Intentaremos nuevamente el <strong>${new Date(retryDate).toLocaleDateString()}</strong>.</p>
        <p>Por favor, actualiza tu método de pago para evitar interrupciones en el servicio.</p>
        <a href="${process.env.FRONTEND_URL}/settings/billing" style="display: inline-block; padding: 12px 24px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Actualizar Método de Pago</a>
      </div>
    `;

    return await this.sendEmail({ to, subject, html });
  }

  /**
   * Send subscription canceled notification
   */
  async sendSubscriptionCanceled({ to, plan, effectiveDate }) {
    const subject = 'Suscripción cancelada';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6b7280;">Suscripción cancelada</h2>
        <p>Tu suscripción al plan <strong>${plan}</strong> ha sido cancelada.</p>
        <p>Tu acceso continuará hasta el <strong>${new Date(effectiveDate).toLocaleDateString()}</strong>.</p>
        <p>Esperamos verte de nuevo pronto.</p>
        <a href="${process.env.FRONTEND_URL}/pricing" style="display: inline-block; padding: 12px 24px; background-color: #6b7280; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Ver Planes</a>
      </div>
    `;

    return await this.sendEmail({ to, subject, html });
  }

  /**
   * Send welcome email
   */
  async sendWelcome({ to, name }) {
    const subject = 'Bienvenido a Grounding Designer Pro';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">¡Bienvenido a Grounding Designer Pro!</h2>
        <p>Hola ${name},</p>
        <p>Gracias por registrarte en Grounding Designer Pro.</p>
        <p>Ya puedes comenzar a diseñar sistemas de puesta a tierra profesionales con nuestras herramientas:</p>
        <ul>
          <li>✅ Cálculos IEEE 80</li>
          <li>✅ Simulaciones FEM</li>
          <li>✅ Generación de reportes PDF</li>
          <li>✅ Análisis de cumplimiento</li>
        </ul>
        <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Comenzar Ahora</a>
      </div>
    `;

    return await this.sendEmail({ to, subject, html });
  }

  /**
   * Send plan upgrade notification
   */
  async sendPlanUpgrade({ to, fromPlan, toPlan }) {
    const subject = `¡Actualizado al plan ${toPlan}!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">¡Felicidades!</h2>
        <p>Has sido actualizado del plan <strong>${fromPlan}</strong> al plan <strong>${toPlan}</strong>.</p>
        <p>Ahora tienes acceso a nuevas características:</p>
        <ul>
          <li>✅ Más simulaciones mensuales</li>
          <li>✅ Exportación de reportes ilimitada</li>
          <li>✅ Simulaciones FEM</li>
          <li>✅ Optimización con IA</li>
        </ul>
        <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Explorar Nuevas Funciones</a>
      </div>
    `;

    return await this.sendEmail({ to, subject, html });
  }

  /**
   * Send batch export ready notification
   */
  async sendBatchExportReady({ to, projectName, downloadUrl, fileCount }) {
    const subject = `Exportación por lotes lista - ${projectName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Exportación por lotes lista</h2>
        <p>La exportación por lotes para el proyecto <strong>${projectName}</strong> ha sido completada.</p>
        <p><strong>Archivos generados:</strong> ${fileCount}</p>
        <a href="${downloadUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Descargar ZIP</a>
      </div>
    `;

    return await this.sendEmail({ to, subject, html });
  }
}

module.exports = new EmailService();
