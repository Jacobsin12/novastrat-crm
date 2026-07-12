const nodemailer = require('nodemailer');
const path = require('path');

// Configuración del transporter SMTP
// Para desarrollo: usa Ethereal (emails ficticios) si no hay credenciales configuradas
// Para producción: configura las variables de entorno SMTP_*
let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    // Producción: usar credenciales reales
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort) || 587,
      secure: parseInt(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    console.log(`[Email] Transporter configurado con ${smtpHost} (${smtpUser})`);
  } else {
    // Desarrollo: usar Ethereal (correos de prueba capturables en ethereal.email)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('[Email] Modo desarrollo: usando Ethereal. Los correos se pueden ver en https://ethereal.email');
    console.log(`[Email] Ethereal user: ${testAccount.user}`);
  }

  return transporter;
}

// Logo SVG del ave de NovaStrat (inline para que no necesite descarga externa)
const LOGO_SVG = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="60" height="60">
  <path d="M10,50 Q40,80 80,30 Q60,60 40,55 Q20,50 10,50 Z" fill="#ffffff"/>
  <path d="M40,55 Q60,30 85,10 Q65,40 40,55 Z" fill="#ffffff"/>
  <path d="M10,50 Q20,30 35,40 Q25,45 10,50 Z" fill="#ffffff"/>
</svg>
`;

/**
 * Genera la plantilla HTML del correo de bienvenida
 */
function buildWelcomeEmailHTML({ name, role, email, tempPassword, loginUrl }) {
  const isClient = role === 'client';
  const roleName = isClient ? 'Cliente' : 'Consultor';
  const greeting = isClient
    ? `¡Bienvenido a NovaStrat, ${name}!`
    : `¡Te damos la bienvenida al equipo, ${name}!`;
  const subtitle = isClient
    ? 'Tu solicitud ha sido aceptada. Ahora eres parte de la familia NovaStrat.'
    : 'Has sido registrado como parte del equipo de consultores de NovaStrat.';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a NovaStrat</title>
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <style>
    /* Evita la inversión a modo oscuro en clientes de correo modernos */
    :root {
      color-scheme: light;
      supported-color-schemes: light;
    }
    body, table, td, p, a, span, h1, h2, h3 {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      body, .email-container {
        background-color: #ffffff !important;
      }
      .email-card {
        background-color: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
      }
      .email-text-main {
        color: #0f172a !important;
      }
      .email-text-muted {
        color: #475569 !important;
      }
      .email-text-title {
        color: #1e365d !important;
      }
      .key-container {
        background-color: #f8fafc !important;
        border: 1px solid #e2e8f0 !important;
      }
      .warning-container {
        background-color: #fffbeb !important;
        border: 1px solid #fde68a !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Tarjeta principal con borde y sombra suave -->
        <table class="email-card" role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 10px 30px rgba(37, 99, 235, 0.04); overflow: hidden;">
          
          <!-- HEADER CON LOGO PWA (Incrustado con CID) -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              <img src="cid:novastrat-logo" alt="NovaStrat Logo" width="56" height="56" style="display: block; margin: 0 auto 16px auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);" />
              <h1 class="email-text-main" style="color: #0f172a; font-size: 24px; margin: 0 0 6px 0; font-weight: 800; letter-spacing: -0.5px;">
                NovaStrat
              </h1>
              <p class="email-text-muted" style="color: #475569; font-size: 12px; margin: 0; letter-spacing: 2px; text-transform: uppercase; font-weight: 600;">
                Consultoría Estratégica
              </p>
            </td>
          </tr>

          <!-- CUERPO PRINCIPAL -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px 40px 20px 40px;">
              <h2 class="email-text-title" style="color: #1e365d; font-size: 20px; margin: 0 0 12px 0; font-weight: 700;">
                ${greeting}
              </h2>
              <p class="email-text-muted" style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
                ${subtitle}
              </p>

              <!-- BADGE DE ROL -->
              <div style="display: inline-block; background-color: ${isClient ? 'rgba(37, 99, 235, 0.08)' : 'rgba(217, 119, 6, 0.08)'}; border: 1px solid ${isClient ? 'rgba(37, 99, 235, 0.2)' : 'rgba(217, 119, 6, 0.2)'}; border-radius: 20px; padding: 6px 16px; margin-bottom: 28px;">
                <span style="color: ${isClient ? '#2563eb' : '#d97706'}; font-size: 13px; font-weight: 600;">
                  Rol: ${roleName}
                </span>
              </div>

              <!-- CAJA DE CREDENCIALES -->
              <div class="key-container" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; margin-bottom: 28px;">
                <h3 class="email-text-title" style="color: #1e365d; font-size: 15px; margin: 0 0 16px 0; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                  <!-- Icono de escudo/bloqueo SVG -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Tus Credenciales de Acceso
                </h3>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span class="email-text-muted" style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Correo electrónico</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 0 16px 0;">
                      <span class="email-text-main" style="color: #1e293b; font-size: 16px; font-weight: 600;">${email}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span class="email-text-muted" style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Contraseña temporal</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0;">
                      <div style="background-color: #1d4ed8; color: #ffffff; font-size: 18px; font-weight: 700; padding: 12px 24px; border-radius: 10px; letter-spacing: 2px; display: inline-block; font-family: 'Courier New', monospace; box-shadow: 0 4px 10px rgba(29, 78, 216, 0.2);">
                        ${tempPassword}
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- AVISO IMPORTANTE -->
              <div class="warning-container" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px;">
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                  <!-- Icono de advertencia SVG -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <strong>Importante:</strong> Al iniciar sesión por primera vez, el sistema te pedirá que cambies tu contraseña por una nueva y segura.
                </p>
              </div>

              <!-- BOTÓN CTA (Azul Cobalto) -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 50px; font-size: 16px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);">
                  Iniciar Sesión
                </a>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #ffffff; padding: 30px 40px; border-radius: 0 0 20px 20px; border-top: 1px solid #f1f5f9;">
              <p class="email-text-muted" style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0 0 12px 0; text-align: center;">
                Este es un correo automático generado por el sistema NovaStrat.<br>
                Por favor, no respondas a este mensaje.
              </p>
              <p style="color: #94a3b8; font-size: 11px; margin: 0; text-align: center;">
                © ${new Date().getFullYear()} NovaStrat · Consultoría Estratégica · Todos los derechos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Envía el correo de bienvenida
 * @param {string} to - Email del destinatario
 * @param {string} name - Nombre del usuario
 * @param {string} role - 'client' o 'consultant'
 * @param {string} tempPassword - Contraseña temporal generada
 * @param {string} loginUrl - URL del login de la web app
 * @returns {Promise<{success: boolean, previewUrl?: string, error?: string}>}
 */
async function sendWelcomeEmail(to, name, role, tempPassword, loginUrl = 'http://localhost:5174/login') {
  try {
    const transport = await getTransporter();

    const subject = role === 'client'
      ? '¡Bienvenido a NovaStrat! - Tus credenciales de acceso'
      : '¡Bienvenido al equipo NovaStrat! - Tus credenciales de acceso';

    const html = buildWelcomeEmailHTML({ name, role, email: to, tempPassword, loginUrl });

    const info = await transport.sendMail({
      from: `"NovaStrat" <${process.env.SMTP_FROM || 'noreply@novastratmx.com'}>`,
      to,
      subject,
      html,
      attachments: [{
        filename: 'logo.png',
        path: path.join(__dirname, '..', 'landing-page', 'public', 'pwa-192x192.png'),
        cid: 'novastrat-logo'
      }]
    });

    console.log(`[Email] Correo de bienvenida enviado a ${to} (${role})`);
    
    // En modo desarrollo con Ethereal, mostrar el link de preview
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email] Preview URL: ${previewUrl}`);
    }

    return { success: true, previewUrl: previewUrl || null };
  } catch (error) {
    console.error(`[Email] Error enviando correo a ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Genera la plantilla HTML del correo de suspensión de cuenta
 */
function buildSuspensionEmailHTML({ name, role, email, reason }) {
  const isClient = role === 'client';
  const roleName = isClient ? 'Cliente' : 'Consultor';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cuenta Suspendida - NovaStrat</title>
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <style>
    /* Evita la inversión a modo oscuro en clientes de correo modernos */
    :root {
      color-scheme: light;
      supported-color-schemes: light;
    }
    body, table, td, p, a, span, h1, h2, h3 {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      body, .email-container {
        background-color: #ffffff !important;
      }
      .email-card {
        background-color: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
      }
      .email-text-main {
        color: #0f172a !important;
      }
      .email-text-muted {
        color: #475569 !important;
      }
      .email-text-title {
        color: #991b1b !important;
      }
      .key-container {
        background-color: #fef2f2 !important;
        border: 1px solid #fecaca !important;
      }
      .warning-container {
        background-color: #eff6ff !important;
        border: 1px solid #bfdbfe !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Tarjeta principal con borde y sombra suave -->
        <table class="email-card" role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 10px 30px rgba(220, 38, 38, 0.04); overflow: hidden;">
          
          <!-- HEADER CON LOGO PWA (Incrustado con CID) -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              <img src="cid:novastrat-logo" alt="NovaStrat Logo" width="56" height="56" style="display: block; margin: 0 auto 16px auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);" />
              <h1 class="email-text-main" style="color: #0f172a; font-size: 24px; margin: 0 0 6px 0; font-weight: 800; letter-spacing: -0.5px;">
                NovaStrat
              </h1>
              <p class="email-text-muted" style="color: #475569; font-size: 12px; margin: 0; letter-spacing: 2px; text-transform: uppercase; font-weight: 600;">
                Seguridad de Cuenta
              </p>
            </td>
          </tr>

          <!-- CUERPO PRINCIPAL -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px 40px 20px 40px;">
              <h2 class="email-text-title" style="color: #b91c1c; font-size: 20px; margin: 0 0 12px 0; font-weight: 700;">
                Tu cuenta ha sido suspendida
              </h2>
              <p class="email-text-muted" style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
                Hola <strong>${name}</strong>, te informamos que tu cuenta de ${roleName} en NovaStrat ha sido temporalmente suspendida por el administrador del sistema.
              </p>

              <!-- CAJA DE MOTIVO -->
              <div class="key-container" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 24px; margin-bottom: 28px;">
                <h3 class="email-text-title" style="color: #b91c1c; font-size: 15px; margin: 0 0 12px 0; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                  <!-- Icono de advertencia SVG en rojo -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Motivo de la Suspensión
                </h3>
                <div style="background-color: #ffffff; border: 1px solid #fecaca; border-radius: 10px; padding: 16px 20px;">
                  <p style="color: #1e293b; font-size: 15px; margin: 0; line-height: 1.5; font-weight: 500;">
                    ${reason || 'No se especificó un motivo.'}
                  </p>
                </div>
              </div>

              <!-- INFO DE CUENTA -->
              <div class="warning-container" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding: 4px 0;">
                      <span class="email-text-muted" style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Cuenta afectada</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 0 12px 0;">
                      <span class="email-text-main" style="color: #1e293b; font-size: 15px; font-weight: 600;">${email}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0;">
                      <span class="email-text-muted" style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Rol</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span class="email-text-main" style="color: #1e293b; font-size: 15px; font-weight: 600;">${roleName}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- MENSAJE DE CONTACTO -->
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px;">
                <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.5;">
                  <!-- Icono de chat SVG -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <strong>¿Tienes dudas?</strong> Si consideras que esto es un error o necesitas más información, por favor contacta al administrador de NovaStrat directamente.
                </p>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #ffffff; padding: 30px 40px; border-radius: 0 0 20px 20px; border-top: 1px solid #f1f5f9;">
              <p class="email-text-muted" style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0 0 12px 0; text-align: center;">
                Este es un correo automático generado por el sistema NovaStrat.<br>
                Por favor, no respondas a este mensaje.
              </p>
              <p style="color: #94a3b8; font-size: 11px; margin: 0; text-align: center;">
                © ${new Date().getFullYear()} NovaStrat · Consultoría Estratégica · Todos los derechos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Envía el correo de suspensión de cuenta
 * @param {string} to - Email del destinatario
 * @param {string} name - Nombre del usuario
 * @param {string} role - 'client' o 'consultant'
 * @param {string} reason - Motivo de la suspensión
 * @returns {Promise<{success: boolean, previewUrl?: string, error?: string}>}
 */
async function sendSuspensionEmail(to, name, role, reason) {
  try {
    const transport = await getTransporter();

    const subject = '⚠️ Tu cuenta de NovaStrat ha sido suspendida';
    const html = buildSuspensionEmailHTML({ name, role, email: to, reason });

    const info = await transport.sendMail({
      from: `"NovaStrat" <${process.env.SMTP_FROM || 'noreply@novastratmx.com'}>`,
      to,
      subject,
      html,
      attachments: [{
        filename: 'logo.png',
        path: path.join(__dirname, '..', 'landing-page', 'public', 'pwa-192x192.png'),
        cid: 'novastrat-logo'
      }]
    });

    console.log(`[Email] Correo de suspensión enviado a ${to} (${role})`);
    
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email] Preview URL: ${previewUrl}`);
    }

    return { success: true, previewUrl: previewUrl || null };
  } catch (error) {
    console.error(`[Email] Error enviando correo de suspensión a ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

function buildPasswordRecoveryEmailHTML({ name, tempPassword, loginUrl }) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperación de Contraseña - NovaStrat</title>
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <style>
    /* Evita la inversión a modo oscuro en clientes de correo modernos */
    :root {
      color-scheme: light;
      supported-color-schemes: light;
    }
    body, table, td, p, a, span, h1, h2, h3 {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      body, .email-container {
        background-color: #ffffff !important;
      }
      .email-card {
        background-color: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
      }
      .email-text-main {
        color: #0f172a !important;
      }
      .email-text-muted {
        color: #475569 !important;
      }
      .email-text-title {
        color: #1e365d !important;
      }
      .key-container {
        background-color: #f8fafc !important;
        border: 1px solid #e2e8f0 !important;
      }
      .warning-container {
        background-color: #fffbeb !important;
        border: 1px solid #fde68a !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Tarjeta principal con borde y sombra suave -->
        <table class="email-card" role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 10px 30px rgba(37, 99, 235, 0.04); overflow: hidden;">
          
          <!-- HEADER CON LOGO PWA (Incrustado con CID) -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              <img src="cid:novastrat-logo" alt="NovaStrat Logo" width="56" height="56" style="display: block; margin: 0 auto 16px auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);" />
              <h1 class="email-text-main" style="color: #0f172a; font-size: 24px; margin: 0 0 6px 0; font-weight: 800; letter-spacing: -0.5px;">
                NovaStrat
              </h1>
              <p class="email-text-muted" style="color: #475569; font-size: 12px; margin: 0; letter-spacing: 2px; text-transform: uppercase; font-weight: 600;">
                Recuperación de Cuenta
              </p>
            </td>
          </tr>

          <!-- CUERPO PRINCIPAL -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px 40px 20px 40px;">
              <h2 class="email-text-title" style="color: #1e365d; font-size: 20px; margin: 0 0 12px 0; font-weight: 700;">
                Hola, ${name}
              </h2>
              <p class="email-text-muted" style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
                Has solicitado la recuperación de tu contraseña. Hemos generado una clave temporal de acceso para ti.
              </p>

              <!-- CAJA DE CLAVE TEMPORAL -->
              <div class="key-container" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 28px; text-align: center;">
                <h3 class="email-text-title" style="color: #1e365d; font-size: 15px; margin: 0 0 12px 0; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;">
                  <!-- Icono de llave SVG -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 1.5 1.5M15.5 7.5 14 6"/></svg>
                  Tu Contraseña Temporal
                </h3>
                <div style="background-color: #1d4ed8; color: #ffffff; font-size: 18px; font-weight: 700; padding: 12px 24px; border-radius: 10px; letter-spacing: 2px; display: inline-block; font-family: 'Courier New', monospace; box-shadow: 0 4px 10px rgba(29, 78, 216, 0.2);">
                  ${tempPassword}
                </div>
              </div>

              <!-- AVISO IMPORTANTE -->
              <div class="warning-container" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px;">
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                  <!-- Icono de advertencia SVG -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <strong>Importante:</strong> Al iniciar sesión con esta contraseña temporal, el sistema te redirigirá obligatoriamente a la pantalla de cambio de contraseña.
                </p>
              </div>

              <!-- BOTÓN CTA (Azul Cobalto Oficial) -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 50px; font-size: 16px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);">
                  Iniciar Sesión
                </a>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #ffffff; padding: 30px 40px; border-radius: 0 0 20px 20px; border-top: 1px solid #f1f5f9;">
              <p class="email-text-muted" style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0 0 12px 0; text-align: center;">
                Si tú no solicitaste este cambio, por favor contacta de inmediato al soporte de NovaStrat.
              </p>
              <p style="color: #94a3b8; font-size: 11px; margin: 0; text-align: center;">
                © ${new Date().getFullYear()} NovaStrat · Todos los derechos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

async function sendPasswordRecoveryEmail(to, name, tempPassword, loginUrl = 'http://localhost:5174/login') {
  try {
    const transport = await getTransporter();
    const subject = '🔒 Recuperación de Contraseña - Clave Temporal NovaStrat';
    const html = buildPasswordRecoveryEmailHTML({ name, tempPassword, loginUrl });

    const info = await transport.sendMail({
      from: `"NovaStrat" <${process.env.SMTP_FROM || 'noreply@novastratmx.com'}>`,
      to,
      subject,
      html,
      attachments: [{
        filename: 'logo.png',
        path: path.join(__dirname, '..', 'landing-page', 'public', 'pwa-192x192.png'),
        cid: 'novastrat-logo'
      }]
    });

    console.log(`[Email] Correo de recuperación enviado a ${to}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email] Preview URL: ${previewUrl}`);
    }
    return { success: true, previewUrl: previewUrl || null };
  } catch (error) {
    console.error(`[Email] Error enviando correo de recuperación a ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendWelcomeEmail, sendSuspensionEmail, sendPasswordRecoveryEmail };

