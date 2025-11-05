/* src/modules/emailVerification/emailVerification.middlewares.ts */
// #section imports
import { Response, NextFunction } from 'express';
import { db } from '../../db/init';
import { emailVerificationTokensTable, usersTable } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import type { AuthenticatedRequest } from '../jwtManager/jwtManager.types';
import {
  generateVerificationToken,
  hashToken,
  generateVerificationUrl,
  calculateExpirationDate,
  isTokenExpired,
  canResendEmail,
  sendVerificationEmail,
} from './emailVerification.utils';
// #end-section

// #middleware sendVerificationEmailMiddleware
/**
 * Middleware: sendVerificationEmailMiddleware
 * 
 * Genera y envía un email de verificación al usuario recién registrado.
 * Guarda el token hasheado en la base de datos.
 * 
 * Este middleware se ejecuta después de crear el usuario en la DB.
 * Requiere que req.body.userDataStore esté presente.
 * 
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar al siguiente middleware
 */
export const sendVerificationEmailMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('sendVerificationEmailMiddleware');
  
  try {
    const { userDataStore, platformName } = req.body;
    
    if (!userDataStore || !userDataStore.id || !userDataStore.email) {
      console.error('❌ Missing user data for verification email');
      res.status(400).json({ error: 'Missing user data' });
      return;
    }
    
    // Solo enviar email a usuarios con plataforma 'local'
    // Usuarios de Google ya tienen email verificado
    if (platformName === 'google') {
      console.log('🔵 Usuario de Google, saltando verificación de email');
      return next();
    }
    
    // #step 1 - Generar token único
    const token = generateVerificationToken();
    const tokenHash = hashToken(token);
    const verificationUrl = generateVerificationUrl(token);
    const expiresAt = calculateExpirationDate();
    // #end-step
    
    // #step 2 - Guardar token en la base de datos
    await db.insert(emailVerificationTokensTable).values({
      userId: userDataStore.id,
      tokenHash,
      expiresAt,
      used: false,
      resendCount: 0,
      lastResendAt: null,
    });
    console.log('✅ Token de verificación guardado en DB');
    // #end-step
    
    // #step 3 - Enviar email de verificación
    await sendVerificationEmail(userDataStore.email, {
      firstName: userDataStore.firstName,
      lastName: userDataStore.lastName,
      verificationUrl,
      appLogoUrl: `${process.env.BASE_URL || 'http://localhost:5173'}/page_icon.jpg`,
    });
    console.log('✅ Email de verificación enviado');
    // #end-step
    
    next();
  } catch (error) {
    console.error('❌ Error en sendVerificationEmailMiddleware:', error);
    // No bloqueamos el registro si falla el email
    // El usuario puede solicitar reenvío después
    next();
  }
};
// #end-middleware

// #middleware verifyEmailTokenMiddleware
/**
 * Middleware: verifyEmailTokenMiddleware
 * 
 * Verifica un token de verificación de email y activa la cuenta del usuario.
 * 
 * @route POST /api/auth/verify-email
 * @access Public
 */
export const verifyEmailTokenMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  console.log('verifyEmailTokenMiddleware');
  
  try {
    const { token } = req.body;
    
    // #step 1 - Validar que se recibió el token
    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Token de verificación no proporcionado',
      });
      return;
    }
    // #end-step
    
    // #step 2 - Buscar token en la base de datos
    const tokenHash = hashToken(token);
    
    const [tokenRecord] = await db
      .select()
      .from(emailVerificationTokensTable)
      .where(eq(emailVerificationTokensTable.tokenHash, tokenHash))
      .limit(1);
    
    if (!tokenRecord) {
      res.status(404).json({
        success: false,
        error: 'Token de verificación inválido o no encontrado',
      });
      return;
    }
    // #end-step
    
    // #step 3 - Verificar que el token no haya sido usado
    if (tokenRecord.used) {
      res.status(400).json({
        success: false,
        error: 'Este token ya fue utilizado',
      });
      return;
    }
    // #end-step
    
    // #step 4 - Verificar que el token no haya expirado
    if (isTokenExpired(tokenRecord.expiresAt)) {
      res.status(400).json({
        success: false,
        error: 'El token de verificación ha expirado. Por favor, solicita uno nuevo.',
      });
      return;
    }
    // #end-step
    
    // #step 5 - Marcar token como usado
    await db
      .update(emailVerificationTokensTable)
      .set({ used: true })
      .where(eq(emailVerificationTokensTable.id, tokenRecord.id));
    // #end-step
    
    // #step 6 - Activar usuario
    await db
      .update(usersTable)
      .set({
        isActive: true,
        state: 'active',
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, tokenRecord.userId));
    
    console.log(`✅ Usuario ${tokenRecord.userId} verificado y activado`);
    // #end-step
    
    // #step 7 - Responder con éxito
    res.status(200).json({
      success: true,
      message: 'Email verificado correctamente. Tu cuenta ha sido activada.',
    });
    // #end-step
  } catch (error) {
    console.error('❌ Error en verifyEmailTokenMiddleware:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar el email',
    });
  }
};
// #end-middleware

// #middleware resendVerificationEmailMiddleware
/**
 * Middleware: resendVerificationEmailMiddleware
 * 
 * Reenvía el email de verificación a un usuario.
 * 
 * @route POST /api/auth/resend-verification
 * @access Private (requiere autenticación)
 */
export const resendVerificationEmailMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  console.log('resendVerificationEmailMiddleware');
  
  try {
    const userId = req.user?.userId;
    
    // #step 1 - Validar que el usuario esté autenticado
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Debes iniciar sesión para reenviar el email',
      });
      return;
    }
    // #end-step
    
    // #step 2 - Buscar usuario en la base de datos
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
      return;
    }
    // #end-step
    
    // #step 3 - Verificar si el usuario ya está verificado
    if (user.isActive && user.state === 'active') {
      res.status(400).json({
        success: false,
        error: 'Tu cuenta ya está verificada',
      });
      return;
    }
    // #end-step
    
    // #step 4 - Buscar tokens existentes del usuario
    const [existingToken] = await db
      .select()
      .from(emailVerificationTokensTable)
      .where(
        and(
          eq(emailVerificationTokensTable.userId, userId),
          eq(emailVerificationTokensTable.used, false)
        )
      )
      .orderBy(emailVerificationTokensTable.createdAt)
      .limit(1);
    // #end-step
    
    // #step 5 - Verificar límites de reenvío
    if (existingToken) {
      const canResend = canResendEmail(
        existingToken.resendCount,
        existingToken.lastResendAt
      );
      
      if (!canResend.canResend) {
        res.status(429).json({
          success: false,
          error: canResend.reason,
        });
        return;
      }
    }
    // #end-step
    
    // #step 6 - Invalidar tokens anteriores
    await db
      .update(emailVerificationTokensTable)
      .set({ used: true })
      .where(
        and(
          eq(emailVerificationTokensTable.userId, userId),
          eq(emailVerificationTokensTable.used, false)
        )
      );
    // #end-step
    
    // #step 7 - Generar nuevo token
    const token = generateVerificationToken();
    const tokenHash = hashToken(token);
    const verificationUrl = generateVerificationUrl(token);
    const expiresAt = calculateExpirationDate();
    
    const newResendCount = existingToken ? existingToken.resendCount + 1 : 1;
    // #end-step
    
    // #step 8 - Guardar nuevo token
    await db.insert(emailVerificationTokensTable).values({
      userId,
      tokenHash,
      expiresAt,
      used: false,
      resendCount: newResendCount,
      lastResendAt: new Date(),
    });
    // #end-step
    
    // #step 9 - Enviar email
    await sendVerificationEmail(user.email, {
      firstName: user.firstName,
      lastName: user.lastName,
      verificationUrl,
      appLogoUrl: `${process.env.BASE_URL || 'http://localhost:5173'}/page_icon.jpg`,
    });
    
    console.log(`✅ Email de verificación reenviado a: ${user.email}`);
    // #end-step
    
    // #step 10 - Responder con éxito
    res.status(200).json({
      success: true,
      message: 'Email de verificación enviado correctamente',
      remainingAttempts: 3 - newResendCount,
    });
    // #end-step
  } catch (error) {
    console.error('❌ Error en resendVerificationEmailMiddleware:', error);
    res.status(500).json({
      success: false,
      error: 'Error al reenviar el email de verificación',
    });
  }
};
// #end-middleware

// #middleware requireVerifiedEmail
/**
 * Middleware: requireVerifiedEmail
 * 
 * Bloquea el acceso si el usuario no ha verificado su email.
 * Debe usarse DESPUÉS de authenticateJWT.
 */
export const requireVerifiedEmail = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'No autenticado',
      });
      return;
    }
    
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
      return;
    }
    
    if (!user.isActive || user.state !== 'active') {
      res.status(403).json({
        success: false,
        error: 'Debes verificar tu email antes de acceder a este recurso',
        requiresVerification: true,
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error('❌ Error en requireVerifiedEmail:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar el estado del usuario',
    });
  }
};
// #end-middleware