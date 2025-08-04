// src/modules/auth/auth.routes.ts
// #section Imports
import { Router } from 'express';
import { 
  validateJWTAndGetPayload,
  validateAccountStatus
} from './auth.middlewares';
// #end-section
const authRouter = Router();
// #route GET >> /me - Used to validate an authentication by JWT
authRouter.get('/me', validateJWTAndGetPayload, validateAccountStatus, (_req, res) => {
  return res.status(200).json({
    message: 'Authentication and account status validated successfully',
  });
});
// #end-route
export default authRouter;

