// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { requireAuth } from './auth.middlewares';

const authRouter = Router();

authRouter.get('/me', requireAuth, (_req, res) => {
  return res.status(200).json({ success: true });
});

export default authRouter;
