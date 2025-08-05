// src\modules\companies\companies.routes.ts
// #section Imports
import { Router } from "express";
import { validateJWTAndGetPayload } from "../auth/auth.middlewares";
import { 
  createCompany, 
  getMyCompanies,
  getCompaniesSocialMedia,
  updateCompanySocialMedia,
  getCompanyLocation,
  updateCompanyLocation,
  getCompanySchedule,
  updateCompanySchedule
} from "./companies.middlewares";
// #end-section
// #variable companiesRouter
const companiesRouter = Router();
// #end-variable
// #route POST >> /create - Creates a new company, stores it in the database, and returns the created company.
companiesRouter.post("/create", validateJWTAndGetPayload, createCompany);
// #end-route
// #route GET >> /mine - Retrieves the companies of the authenticated user.
companiesRouter.get("/mine", validateJWTAndGetPayload, getMyCompanies);
// #end-route
// #route GET >> /:id/socials - Retrieves the social media links of a specific company.
companiesRouter.get("/:id/socials", validateJWTAndGetPayload, getCompaniesSocialMedia);
// #end-route
// #route PUT >> /:id/socials - Updates the social media links of a specific company.
companiesRouter.put("/:id/socials", validateJWTAndGetPayload, updateCompanySocialMedia);
// #end-route
// #route GET >> /:id/location - Retrieves the location of a specific company.
companiesRouter.get("/:id/location", validateJWTAndGetPayload, getCompanyLocation);
// #end-route
// #route PUT >> /:id/location - Updates the location of a specific company.
companiesRouter.put("/:id/location", validateJWTAndGetPayload, updateCompanyLocation);
// #end-route
// #route GET >> /:id/schedule - Retrieves the schedule of a specific company.
companiesRouter.get("/:id/schedule", validateJWTAndGetPayload, getCompanySchedule);
// #end-route
// #route PUT >> /:id/schedule - Updates the weekly schedule of a specific company.
companiesRouter.put("/:id/schedule", validateJWTAndGetPayload, updateCompanySchedule);
// #end-route
export default companiesRouter;
