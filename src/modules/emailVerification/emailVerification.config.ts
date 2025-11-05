/* src/modules/emailVerification/emailVerification.config.ts */
// #section imports
import type { EmailVerificationConfig } from './emailVerification.types';
// #end-section

// #section validation
/**
 * Validación de variables de entorno requeridas.
 */
const requiredEnvVars = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM_NAME',
  'EMAIL_FROM_ADDRESS',
  'FRONTEND_BASE_URL',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(
    `⚠️ Warning: Missing email verification environment variables: ${missingVars.join(', ')}`
  );
  console.warn('Email verification module will not work properly.');
}
// #end-section

// #variable EMAIL_VERIFICATION_CONFIG
/**
 * Configuración principal del módulo de verificación de email.
 * 
 * Todos los valores provienen de variables de entorno para permitir
 * configuración sin modificar código.
 * 
 * @example
 * // Uso en otro archivo
 * import { EMAIL_VERIFICATION_CONFIG } from './emailVerification.config';
 * console.log(EMAIL_VERIFICATION_CONFIG.tokenExpirationMs); // 3600000 (1 hora)
 */
export const EMAIL_VERIFICATION_CONFIG: EmailVerificationConfig = {
  // 1 hora de expiración para el token
  tokenExpirationMs: 60 * 60 * 1000,
  
  // Máximo 3 reenvíos permitidos
  maxResendAttempts: 3,
  
  // 2 minutos de cooldown entre reenvíos
  resendCooldownMs: 2 * 60 * 1000,
  
  // URL del frontend
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:5173',
  
  // Configuración SMTP
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true para puerto 465, false para otros
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
  
  // Información del remitente
  emailFrom: {
    name: process.env.EMAIL_FROM_NAME || 'Kitchen Solutions',
    address: process.env.EMAIL_FROM_ADDRESS || 'noreply@kitchensolutions.com',
  },
};
// #end-variable

// #variable VERIFICATION_ROUTES
/**
 * Rutas del módulo de verificación.
 */
export const VERIFICATION_ROUTES = {
  VERIFY_EMAIL: '/verify-email',
  RESEND_VERIFICATION: '/resend-verification',
} as const;
// #end-variable