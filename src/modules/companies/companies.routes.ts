// src\modules\businesses\businesses.routes.ts
// #section Imports
import { Router } from "express";
import { requireAuth } from "../auth/auth.middlewares";
import { 
  createCompany, 
  getMyCompanies,
  getCompaniesSocialMedia,
  updateCompanySocialMedia,
  getCompanyLocation,
  updateCompanyLocation
} from "./companies.middlewares";
// #end-section
// #section Creción y configuración del router
const companiesRouter = Router();
// #end-section
// #router POST /create - Crea un nuevo negocio, lo guarda en la base de datos y retorna el negocio creado.
companiesRouter.post("/create", requireAuth, createCompany);
// #end-router
// #router GET /mine - Obtiene los negocios del usuario autenticado.
companiesRouter.get("/mine", requireAuth, getMyCompanies);
// #end-router
// #router GET /:id/socials - Actualiza los enlaces de redes sociales de un negocio específico.
companiesRouter.get("/:id/socials", requireAuth, getCompaniesSocialMedia);
// #end-router
// #router PUT /:id/socials - Obtiene los enlaces de redes sociales de un negocio específico.
companiesRouter.put("/:id/socials", requireAuth, updateCompanySocialMedia);
// #end-router
// #router GET /:id/location - Obtiene la localización de un negocio específico.
companiesRouter.get("/:id/location", requireAuth, getCompanyLocation);
// #end-router
// #router PUT /:id/location - Actualiza la localización de un negocio específico.
companiesRouter.put("/:id/location", requireAuth, updateCompanyLocation);
// #end-router
export default companiesRouter;
