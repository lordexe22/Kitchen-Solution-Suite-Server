/* src/modules/emailVerification/emailVerification.routes.ts */
// #section imports
import { Router } from 'express';
import { 
  verifyEmailTokenMiddleware, 
  resendVerificationEmailMiddleware 
} from './emailVerification.middlewares';
import { validateJWTAndGetPayload } from '../jwtManager';
// #end-section

// #variable emailVerificationRouter
const emailVerificationRouter = Router();
// #end-variable

// #route POST /verify-email
/**
 * Verifica un token de verificación de email.
 * 
 * @route POST /api/auth/verify-email
 * @access Public
 */
emailVerificationRouter.post('/verify-email', verifyEmailTokenMiddleware);
// #end-route

// #route POST /resend-verification
/**
 * Reenvía el email de verificación.
 * 
 * @route POST /api/auth/resend-verification
 * @access Private
 */
emailVerificationRouter.post(
  '/resend-verification', 
  validateJWTAndGetPayload, 
  resendVerificationEmailMiddleware
);
// #end-route

export default emailVerificationRouter;