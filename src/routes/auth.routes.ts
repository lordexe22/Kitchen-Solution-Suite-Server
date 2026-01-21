// src/routes/auth.routes.ts
// #section Imports
import { Router } from "express";
import {
  registerMiddleware,
  loginMiddleware,
  autoLoginMiddleware,
} from "../middlewares/auth.middlewares";
// #end-section

// #section Create authRouter
export const authRouter = Router();
// #end-section

// #route POST /register - User registration
authRouter.post('/register', registerMiddleware);
// #end-route

// #route POST /login - User login
authRouter.post('/login', loginMiddleware);
// #end-route

// #route POST /auto-login - Auto login by JWT cookie
authRouter.post('/auto-login', autoLoginMiddleware);
// #end-route
