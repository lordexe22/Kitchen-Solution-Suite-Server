// src\modules\companies\companies.routes.ts
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
// #variable companiesRouter
const companiesRouter = Router();
// #end-variable
// #route POST >> /create - Creates a new company, stores it in the database, and returns the created company.
companiesRouter.post("/create", requireAuth, createCompany);
// #end-route
// #route GET >> /mine - Retrieves the companies of the authenticated user.
companiesRouter.get("/mine", requireAuth, getMyCompanies);
// #end-route
// #route GET >> /:id/socials - Retrieves the social media links of a specific company.
companiesRouter.get("/:id/socials", requireAuth, getCompaniesSocialMedia);
// #end-route
// #route PUT >> /:id/socials - Updates the social media links of a specific company.
companiesRouter.put("/:id/socials", requireAuth, updateCompanySocialMedia);
// #end-route
// #route GET >> /:id/location - Retrieves the location of a specific company.
companiesRouter.get("/:id/location", requireAuth, getCompanyLocation);
// #end-route
// #route PUT >> /:id/location - Updates the location of a specific company.
companiesRouter.put("/:id/location", requireAuth, updateCompanyLocation);
// #end-route
export default companiesRouter;
