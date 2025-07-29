// src/modules/auth/auth.routes.ts
// #section Imports
import { Router } from 'express';
import { requireAuth } from './auth.middlewares';
// #end-section
const authRouter = Router();
// #route GET >> /me - Used to validate an authentication by JWT
authRouter.get('/me', requireAuth, (_req, res) => {
  return res.status(200).json({ success: true });
});
// #end-route
export default authRouter;

