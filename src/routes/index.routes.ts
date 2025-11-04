/* src\routes\index.routes.ts */
// #section Imports
import { Router } from "express";
import { API_ROUTES } from "../config/routes.config";
import { jwtManagerRoutes } from "../modules/jwtManager";
import { 
  validateRegisterPayload,
  hashPasswordMiddleware,
  addNewUserDataToDB,
  fetchUserDataFromDB,
  fetchUserDataByUserId,
  createJWT,
  setJWTonCookies,
  returnUserData,
  validateLoginPayload,
  getUserFromDB,
  savePlatformToken
} from "../middlewares/auth/auth.middlewares";
import { validateJWTAndGetPayload } from "../modules/jwtManager";
// #end-section

export const authRouter = Router();

authRouter.use('/jwt', jwtManagerRoutes);

authRouter.post(API_ROUTES.REGISTER_URL,
  validateRegisterPayload,
  hashPasswordMiddleware,
  addNewUserDataToDB,
  savePlatformToken,
  fetchUserDataFromDB,
  createJWT,
  setJWTonCookies,
  returnUserData
)

authRouter.post(API_ROUTES.LOGIN_URL,
  validateLoginPayload,
  getUserFromDB,
  createJWT,
  setJWTonCookies,
  returnUserData
)

authRouter.post(API_ROUTES.AUTO_LOGIN_BY_TOKEN_URL,
  validateJWTAndGetPayload,
  fetchUserDataByUserId,
  returnUserData
)