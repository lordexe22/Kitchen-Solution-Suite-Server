/* src/modules/emailVerification/index.ts */

// #section Exports - Types
export * from './emailVerification.types';
// #end-section

// #section Exports - Config
export { EMAIL_VERIFICATION_CONFIG, VERIFICATION_ROUTES } from './emailVerification.config';
// #end-section

// #section Exports - Utils
export {
  generateVerificationToken,
  hashToken,
  generateVerificationUrl,
  calculateExpirationDate,
  isTokenExpired,
  canResendEmail,
  formatExpirationTime,
  sendVerificationEmail,
  testEmailConnection,
} from './emailVerification.utils';
// #end-section

// #section Exports - Templates
export { 
  generateVerificationEmailHTML, 
  generateVerificationEmailText 
} from './emailVerification.template';
// #end-section

// #section Exports - Middlewares
export {
  sendVerificationEmailMiddleware,
  verifyEmailTokenMiddleware,
  resendVerificationEmailMiddleware,
  requireVerifiedEmail,
} from './emailVerification.middlewares';
// #end-section

// #section Exports - Routes
export { default as emailVerificationRoutes } from './emailVerification.routes';
// #end-section