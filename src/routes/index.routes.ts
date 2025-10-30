/* src\routes\index.routes.ts */
// #section Imports
import { Router } from "express";
import { API_ROUTES } from "../config/routes.config";
import { 
  validateRegisterPayload,
  hashPasswordMiddleware,
  addNewUserDataToDB,
  fetchUserDataFromDB,
  createJWT,
  setJWTonCookies,
  returnUserData,
  validateLoginPayload,
  getUserFromDB
} from "../middlewares/auth/auth.middlewares";
// #end-section

export const authRouter = Router();

authRouter.post(`${API_ROUTES.REGISTER_URL}`,
  validateRegisterPayload, // validar los datos del usuario obtenidos desde el cliente
  hashPasswordMiddleware, // generar el hash de la contraseña antes de guardar en la base de datos
  addNewUserDataToDB, // se agregan los datos del usuario validados a la base de datos
  fetchUserDataFromDB,  // se obtienen los datos del usuario recien creado desde la base de datos
  createJWT, // se crea un JWT a partir de los datos del usuario
  setJWTonCookies, // se agrega el jwt a las cookies (consumo para HTTP only)
  returnUserData //  se retornan los datos del usuario al cliente
)

authRouter.post(API_ROUTES.LOGIN_URL,
  validateLoginPayload, // validar los datos del usuario obtenidos desde el cliente
  getUserFromDB, // busca al usuario en la base de datos (email + password | googleToken)  
  createJWT, // se crea un JWT a partir de los datos del usuario
  setJWTonCookies, // se agrega el jwt a las cookies (consumo para HTTP only)
  returnUserData // se retornan los datos del usuario al cliente
)

// authRouter.post(API_ROUTES.AUTO_LOGIN_BY_TOKEN_URL,
  // validateJWTfromCookies - valida el JWT guardado en las cookies (fecha de expiracion, formato, etc)
  // getDataFromJWT - obtiene los datos del JWT
  // validateUserByJWT - valida al usuario buscandolo en la base de datos desde la data del JWT
  // returnUserData - se retornan los datos del usuario al cliente
// )