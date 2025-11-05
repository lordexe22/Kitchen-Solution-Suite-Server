/* src/modules/emailVerification/emailVerification.utils.ts */
// #section imports
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { EMAIL_VERIFICATION_CONFIG } from './emailVerification.config';
import { generateVerificationEmailHTML, generateVerificationEmailText } from './emailVerification.template';
import type { VerificationEmailData } from './emailVerification.types';
// #end-section

// #variable transporter
/**
 * Instancia del transportador de nodemailer.
 * Se crea una sola vez y se reutiliza para todos los envíos.
 */
let transporter: Transporter | null = null;
// #end-variable

// #function getTransporter
/**
 * Obtiene o crea el transportador de nodemailer.
 * 
 * Implementa el patrón Singleton para reutilizar la conexión SMTP.
 * 
 * @returns {Transporter} Instancia del transportador de nodemailer
 */
const getTransporter = (): Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: EMAIL_VERIFICATION_CONFIG.smtp.host,
      port: EMAIL_VERIFICATION_CONFIG.smtp.port,
      secure: EMAIL_VERIFICATION_CONFIG.smtp.secure,
      auth: {
        user: EMAIL_VERIFICATION_CONFIG.smtp.auth.user,
        pass: EMAIL_VERIFICATION_CONFIG.smtp.auth.pass,
      },
    });
  }
  
  return transporter;
};
// #end-function

// #function generateVerificationToken
/**
 * Genera un token único y seguro para verificación de email.
 * 
 * @returns {string} Token único en formato hexadecimal
 */
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
// #end-function

// #function hashToken
/**
 * Genera un hash SHA-256 del token.
 * 
 * Nunca guardamos tokens en texto plano en la base de datos.
 * 
 * @param {string} token - Token en texto plano
 * @returns {string} Hash SHA-256 del token
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
// #end-function

// #function generateVerificationUrl
/**
 * Construye la URL completa de verificación para incluir en el email.
 * 
 * @param {string} token - Token de verificación en texto plano
 * @returns {string} URL completa de verificación
 */
export const generateVerificationUrl = (token: string): string => {
  const baseUrl = EMAIL_VERIFICATION_CONFIG.frontendBaseUrl;
  return `${baseUrl}/verify-email?token=${token}`;
};
// #end-function

// #function calculateExpirationDate
/**
 * Calcula la fecha de expiración del token.
 * 
 * @returns {Date} Fecha de expiración (1 hora desde ahora por defecto)
 */
export const calculateExpirationDate = (): Date => {
  const now = new Date();
  return new Date(now.getTime() + EMAIL_VERIFICATION_CONFIG.tokenExpirationMs);
};
// #end-function

// #function isTokenExpired
/**
 * Verifica si un token ha expirado.
 * 
 * @param {Date} expiresAt - Fecha de expiración del token
 * @returns {boolean} true si el token expiró
 */
export const isTokenExpired = (expiresAt: Date): boolean => {
  return new Date() > expiresAt;
};
// #end-function

// #function canResendEmail
/**
 * Verifica si un usuario puede reenviar el email de verificación.
 * 
 * @param {number} resendCount - Cantidad de reenvíos realizados
 * @param {Date | null} lastResendAt - Fecha del último reenvío
 * @returns {{canResend: boolean, reason?: string}} Resultado de la validación
 */
export const canResendEmail = (
  resendCount: number,
  lastResendAt: Date | null
): { canResend: boolean; reason?: string } => {
  if (resendCount >= EMAIL_VERIFICATION_CONFIG.maxResendAttempts) {
    return {
      canResend: false,
      reason: `Ha excedido el límite de ${EMAIL_VERIFICATION_CONFIG.maxResendAttempts} reenvíos`,
    };
  }

  if (!lastResendAt) {
    return { canResend: true };
  }

  const now = new Date();
  const timeSinceLastResend = now.getTime() - lastResendAt.getTime();

  if (timeSinceLastResend < EMAIL_VERIFICATION_CONFIG.resendCooldownMs) {
    const remainingSeconds = Math.ceil(
      (EMAIL_VERIFICATION_CONFIG.resendCooldownMs - timeSinceLastResend) / 1000
    );
    return {
      canResend: false,
      reason: `Debe esperar ${remainingSeconds} segundos antes de reenviar`,
    };
  }

  return { canResend: true };
};
// #end-function

// #function formatExpirationTime
/**
 * Formatea el tiempo de expiración para mostrar al usuario.
 * 
 * @returns {string} Tiempo de expiración formateado
 */
export const formatExpirationTime = (): string => {
  const minutes = EMAIL_VERIFICATION_CONFIG.tokenExpirationMs / (60 * 1000);
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours} hora${hours > 1 ? 's' : ''}`;
  }
  
  return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
};
// #end-function

// #function sendVerificationEmail
/**
 * Envía un email de verificación al usuario.
 * 
 * @async
 * @param {string} to - Dirección de email del destinatario
 * @param {VerificationEmailData} data - Datos para personalizar el email
 * @returns {Promise<void>}
 * @throws {Error} Si falla el envío del email
 */
export const sendVerificationEmail = async (
  to: string,
  data: VerificationEmailData
): Promise<void> => {
  try {
    const transporter = getTransporter();
    
    const mailOptions = {
      from: {
        name: EMAIL_VERIFICATION_CONFIG.emailFrom.name,
        address: EMAIL_VERIFICATION_CONFIG.emailFrom.address,
      },
      to,
      subject: `Verifica tu cuenta en ${EMAIL_VERIFICATION_CONFIG.emailFrom.name}`,
      html: generateVerificationEmailHTML(data),
      text: generateVerificationEmailText(data),
    };
    
    await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email de verificación enviado a: ${to}`);
  } catch (error) {
    console.error('❌ Error enviando email de verificación:', error);
    throw new Error('Failed to send verification email');
  }
};
// #end-function

// #function testEmailConnection
/**
 * Verifica que la configuración SMTP sea correcta.
 * 
 * @async
 * @returns {Promise<boolean>} true si la conexión es exitosa
 */
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('✅ Conexión SMTP verificada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error verificando conexión SMTP:', error);
    return false;
  }
};
// #end-function