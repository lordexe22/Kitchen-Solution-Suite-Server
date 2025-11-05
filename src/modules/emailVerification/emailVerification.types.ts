/* src/modules/emailVerification/emailVerification.types.ts */
// #interface EmailVerificationToken
/**
 * Representa un token de verificación de email en la base de datos.
 */
export interface EmailVerificationToken {
  /** ID único del token */
  id: number;
  /** ID del usuario asociado */
  userId: number;
  /** Hash del token (nunca se guarda en texto plano) */
  tokenHash: string;
  /** Fecha de creación del token */
  createdAt: Date;
  /** Fecha de expiración del token */
  expiresAt: Date;
  /** Indica si el token ya fue usado */
  used: boolean;
  /** Cantidad de veces que se reenvió el email */
  resendCount: number;
  /** Fecha del último reenvío */
  lastResendAt: Date | null;
}
// #end-interface

// #interface EmailVerificationConfig
/**
 * Configuración del módulo de verificación de email.
 */
export interface EmailVerificationConfig {
  /** Tiempo de expiración del token en milisegundos */
  tokenExpirationMs: number;
  /** Máximo número de reenvíos permitidos */
  maxResendAttempts: number;
  /** Tiempo mínimo entre reenvíos en milisegundos */
  resendCooldownMs: number;
  /** URL base del frontend para construir el link de verificación */
  frontendBaseUrl: string;
  /** Configuración SMTP */
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  /** Información del remitente */
  emailFrom: {
    name: string;
    address: string;
  };
}
// #end-interface

// #interface VerificationEmailData
/**
 * Datos necesarios para generar el email de verificación.
 */
export interface VerificationEmailData {
  /** Nombre del usuario */
  firstName: string;
  /** Apellido del usuario (opcional) */
  lastName?: string;
  /** URL de verificación con token */
  verificationUrl: string;
  /** URL del logo de la aplicación */
  appLogoUrl?: string;
}
// #end-interface

// #interface SendVerificationEmailParams
/**
 * Parámetros para enviar un email de verificación.
 */
export interface SendVerificationEmailParams {
  /** ID del usuario */
  userId: number;
  /** Email del usuario */
  email: string;
  /** Nombre del usuario (para personalizar el email) */
  firstName: string;
  /** Apellido del usuario (opcional) */
  lastName?: string;
}
// #end-interface

// #interface VerifyEmailTokenParams
/**
 * Parámetros para verificar un token de email.
 */
export interface VerifyEmailTokenParams {
  /** Token recibido desde el link */
  token: string;
}
// #end-interface

// #interface ResendVerificationEmailParams
/**
 * Parámetros para reenviar un email de verificación.
 */
export interface ResendVerificationEmailParams {
  /** ID del usuario */
  userId: number;
  /** Email del usuario */
  email: string;
  /** Nombre del usuario */
  firstName: string;
  /** Apellido del usuario (opcional) */
  lastName?: string;
}
// #end-interface

// #type EmailVerificationResult
/**
 * Resultado de una operación de verificación.
 */
export type EmailVerificationResult =
  | { success: true; message: string }
  | { success: false; error: string };
// #end-type