// src/routes/auth.routes.ts
// #section Imports
import { Router } from "express";
import {
  validateRegisterPayload,
  hashPasswordMiddleware,
  addNewUserDataToDB,
  savePlatformToken,
  fetchUserDataFromDB,
  fetchUserDataByUserId,
  createJWTMiddleware,
  setJWTonCookies,
  returnUserData,
  validateLoginPayload,
  getUserFromDB,
  validateJWTAndGetPayload,
} from "../middlewares/auth.middlewares";
// #end-section

// #section Create authRouter
export const authRouter = Router();
// #end-section

// #route POST /register - User registration
authRouter.post('/register',
  validateRegisterPayload,
  hashPasswordMiddleware,
  addNewUserDataToDB,
  savePlatformToken,
  fetchUserDataFromDB,
  createJWTMiddleware,
  setJWTonCookies,
  returnUserData
);
// #end-route

// #route POST /login - User login
authRouter.post('/login',
  validateLoginPayload,
  getUserFromDB,
  createJWTMiddleware,
  setJWTonCookies,
  returnUserData
);
// #end-route

// #route POST /auto-login - Auto login by token
authRouter.post('/auto-login',
  validateJWTAndGetPayload,
  fetchUserDataByUserId,
  returnUserData
);
// #end-route
