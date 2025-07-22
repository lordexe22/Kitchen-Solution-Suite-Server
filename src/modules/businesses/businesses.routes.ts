// src\modules\businesses\businesses.routes.ts
// #section Imports
import { Router } from "express";
import { requireAuth } from "../auth/auth.middlewares";
import { 
  createBusiness, 
  getMyBusinesses,
  updateBusinessSocials,
  getBusinessSocials
} from "./businesses.middlewares";
// #end-section
// #section Creción y configuración del router
const businessRouter = Router();
// #end-section
// #router POST /create - Crea un nuevo negocio, lo guarda en la base de datos y retorna el negocio creado.
businessRouter.post("/create", requireAuth, createBusiness);
// #end-router
// #router GET /mine - Obtiene los negocios del usuario autenticado.
businessRouter.get("/mine", requireAuth, getMyBusinesses);
// #end-router
// #router PUT /:id/socials - Actualiza los enlaces de redes sociales de un negocio específico.
businessRouter.put("/:id/socials", requireAuth, updateBusinessSocials);
// #end-router
// #router GET /:id/socials - Obtiene los enlaces de redes sociales de un negocio específico.
businessRouter.get("/:id/socials", requireAuth, getBusinessSocials);
// #end-router
export default businessRouter;
