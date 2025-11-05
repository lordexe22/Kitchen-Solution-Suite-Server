/* src/modules/emailVerification/emailVerification.template.ts */
// #section imports
import { EMAIL_VERIFICATION_CONFIG } from './emailVerification.config';
import { formatExpirationTime } from './emailVerification.utils';
import type { VerificationEmailData } from './emailVerification.types';
// #end-section

// #function generateVerificationEmailHTML
/**
 * Genera el HTML del email de verificación.
 * 
 * Template responsive con diseño moderno y profesional.
 * Compatible con los principales clientes de email.
 * 
 * @param {VerificationEmailData} data - Datos para personalizar el email
 * @returns {string} HTML del email
 * 
 * @example
 * const html = generateVerificationEmailHTML({
 *   firstName: 'Juan',
 *   lastName: 'Pérez',
 *   verificationUrl: 'https://app.com/verify?token=abc123',
 *   appLogoUrl: 'https://app.com/logo.png'
 * });
 */
export const generateVerificationEmailHTML = (data: VerificationEmailData): string => {
  const { firstName, lastName, verificationUrl, appLogoUrl } = data;
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;
  const expirationTime = formatExpirationTime();
  const appName = EMAIL_VERIFICATION_CONFIG.emailFrom.name;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu cuenta - ${appName}</title>
  <style>
    /* Reset básico */
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
    }
    
    /* Contenedor principal */
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    /* Header con logo */
    .email-header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      padding: 40px 20px;
      text-align: center;
    }
    
    .email-logo {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #ffffff;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    
    .email-title {
      color: #ffffff;
      font-size: 28px;
      font-weight: 600;
      margin: 20px 0 10px;
    }
    
    .email-subtitle {
      color: #e0e7ff;
      font-size: 16px;
      margin: 0;
    }
    
    /* Cuerpo del email */
    .email-body {
      padding: 40px 30px;
      color: #374151;
      line-height: 1.6;
    }
    
    .greeting {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 20px;
    }
    
    .message {
      font-size: 16px;
      margin-bottom: 30px;
    }
    
    /* Botón de verificación */
    .cta-container {
      text-align: center;
      margin: 35px 0;
    }
    
    .cta-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
      transition: all 0.3s ease;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
    }
    
    /* Información adicional */
    .info-box {
      background-color: #f9fafb;
      border-left: 4px solid #2563eb;
      padding: 16px 20px;
      margin: 25px 0;
      border-radius: 6px;
    }
    
    .info-box p {
      margin: 8px 0;
      font-size: 14px;
      color: #6b7280;
    }
    
    .info-box strong {
      color: #374151;
    }
    
    /* Link alternativo */
    .alt-link {
      background-color: #f3f4f6;
      padding: 16px;
      border-radius: 6px;
      margin: 25px 0;
      word-break: break-all;
    }
    
    .alt-link p {
      margin: 0 0 8px;
      font-size: 13px;
      color: #6b7280;
    }
    
    .alt-link a {
      color: #2563eb;
      text-decoration: none;
      font-size: 12px;
    }
    
    /* Footer */
    .email-footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    
    .email-footer p {
      margin: 8px 0;
      font-size: 13px;
      color: #6b7280;
    }
    
    .email-footer a {
      color: #2563eb;
      text-decoration: none;
    }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 20px 10px;
      }
      
      .email-body {
        padding: 30px 20px;
      }
      
      .cta-button {
        padding: 14px 30px;
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="email-header">
      ${appLogoUrl ? `<img src="${appLogoUrl}" alt="${appName} Logo" class="email-logo">` : ''}
      <h1 class="email-title">Verifica tu cuenta</h1>
      <p class="email-subtitle">Solo un paso más para comenzar</p>
    </div>
    
    <!-- Body -->
    <div class="email-body">
      <p class="greeting">¡Hola, ${fullName}!</p>
      
      <p class="message">
        Gracias por registrarte en <strong>${appName}</strong>. 
        Para completar tu registro y comenzar a usar nuestra aplicación, 
        necesitamos verificar tu dirección de correo electrónico.
      </p>
      
      <div class="cta-container">
        <a href="${verificationUrl}" class="cta-button">
          ✓ Verificar mi cuenta
        </a>
      </div>
      
      <div class="info-box">
        <p><strong>⏱️ Tiempo de expiración:</strong></p>
        <p>Este enlace expirará en ${expirationTime}.</p>
        <p><strong>🔒 Seguridad:</strong></p>
        <p>Si no creaste esta cuenta, ignora este correo.</p>
      </div>
      
      <div class="alt-link">
        <p><strong>¿El botón no funciona?</strong> Copia y pega este enlace en tu navegador:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
      </div>
      
      <p class="message" style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        Si tienes problemas o preguntas, no dudes en contactarnos.
      </p>
    </div>
    
    <!-- Footer -->
    <div class="email-footer">
      <p><strong>${appName}</strong></p>
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
      <p style="margin-top: 15px;">
        © ${new Date().getFullYear()} ${appName}. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};
// #end-function

// #function generateVerificationEmailText
/**
 * Genera la versión en texto plano del email (fallback para clientes sin HTML).
 * 
 * @param {VerificationEmailData} data - Datos para personalizar el email
 * @returns {string} Texto plano del email
 */
export const generateVerificationEmailText = (data: VerificationEmailData): string => {
  const { firstName, lastName, verificationUrl } = data;
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;
  const expirationTime = formatExpirationTime();
  const appName = EMAIL_VERIFICATION_CONFIG.emailFrom.name;

  return `
Hola, ${fullName}!

Gracias por registrarte en ${appName}.

Para completar tu registro, por favor verifica tu dirección de correo electrónico haciendo clic en el siguiente enlace:

${verificationUrl}

Este enlace expirará en ${expirationTime}.

Si no creaste esta cuenta, ignora este correo.

---
${appName}
© ${new Date().getFullYear()} Todos los derechos reservados.

Este es un correo automático, por favor no respondas a este mensaje.
  `.trim();
};
// #end-function