/* src\modules\companies\companies.middlewares.ts */
// #section Imports
import { Response } from "express";
import { pool } from "../../db/pool";
import { AuthenticatedRequest } from "../auth/auth.types";
import { 
  VERIFY_COMPANY_OWNERSHIP,
  UPSERT_COMPANY_SOCIALS,
  GET_COMPANY_LOCATION,
  GET_COMPANY_SOCIALS,
  GET_MY_COMPANIES,
  INSERT_COMPANY,
  UPSERT_COMPANY_LOCATION
} from "./companies.queries";
// #end-section
// #function updateCompanySocialMedia - Updates the social media links of a specific business.
export const updateCompanySocialMedia = async (req: AuthenticatedRequest, res: Response) => {
  // #variable - ownerId, businessId
  const ownerId = req.user!.id; // El ! indica que estamos seguros de que user no es undefined
  const businessId = Number(req.params.id);
  // #end-variable
  // #step 1 - Validate that the business ID is a valid number
  if (isNaN(businessId)) {
    console.error("❌ ID de negocio inválido:", req.params.id);
    return res.status(400).json({ error: "ID de negocio inválido" });
  }
  // #end-step
  // #step 2 - Capture the social media links from the request body
  const {
    facebook_url,
    instagram_url,
    x_url,
    tiktok_url,
    threads_url
  } = req.body;
  // #end-step
  try {
    // #step 3 - Verify that the business belongs to the authenticated user
    const verify = await pool.query(VERIFY_COMPANY_OWNERSHIP, [businessId, ownerId]);

    if (verify.rowCount === 0) {
      console.warn(`⚠️ El negocio ${businessId} no pertenece al usuario ${ownerId}`);
      return res.status(403).json({ error: "Negocio no encontrado o sin permisos" });
    }
    // #end-step
    // #step 4 - Create an SQL query with an UPSERT for the business_socials table >> upsertQuery
    const upsertQuery = UPSERT_COMPANY_SOCIALS;
    // #end-step
    // #step 5 - Prepare the values for the UPSERT >> values[]
    const values = [
      businessId,
      facebook_url || null,
      instagram_url || null,
      x_url || null,
      tiktok_url || null,
      threads_url || null
    ];
    // #end-step
    // #step 6 - Execute the UPSERT query
    await pool.query(upsertQuery, values);
    // #end-step
    // #step 7 - Return a successful response
    return res.status(200).json({ message: "Redes sociales actualizadas correctamente" });
    // #end-step
  } catch (error:unknown) {
    // #step 8 - Exception handling
    console.error("❌ Error en la base de datos:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
    // #end-step
  }
};
// #end-function
// #function createCompany - Creates a new company associated with the authenticated user and stores it in the database.
export const createCompany = async (req: AuthenticatedRequest, res: Response) => {
  // #variable - ownerId, name, alias
  const ownerId = req.user!.id;
  const { name, alias } = req.body;
  // #end-variable
  // #step 1 - Validate that the business name exists and is a string
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Nombre del negocio es obligatorio" });
  }
  // #end-step
  try {
    // #step 2 - Prepare an SQL query to insert the business into the database
    const insertQuery = INSERT_COMPANY;
    // #end-step
    // #step 3 - Prepare values for the SQL query
    const values = [name.trim(), alias?.trim() || null, ownerId];
    // #end-step
    // #step 4 - Execute the query to insert the business into the database and get the created business >> newBusiness
    const result = await pool.query(insertQuery, values);
    const newBusiness = result.rows[0];
    // #end-step
    // #step 5 - Return response with the created business
    return res.status(201).json({ companies: newBusiness });
    // #end-step
  } catch (error: unknown) {
    // #step 6 - Exception handling
    return res.status(500).json({ error: "Error interno del servidor" });
    // #end-step
  }
};
// #end-function
// #function getMyCompanies - Retrieves all companies associated with the authenticated user
export const getMyCompanies = async (req: AuthenticatedRequest, res: Response) => {
  // #variable - ownerId
  const ownerId = req.user!.id;
  // #end-variable
  try {
    // #step 1 - Query all businesses of the authenticated user >> result
    const result = await pool.query(GET_MY_COMPANIES, [ownerId]);
    // #end-step
    // #step 2 - Return the list of companies
    return res.status(200).json({ companies: result.rows });
    // #end-step
  } catch (error: unknown) {
    // #step 3 - Exception handling
    return res.status(500).json({ error: "Error interno del servidor" });
    // #end-step
  }
};
// #end-function
// #function getCompaniesSocialMedia - Retrieves the social media associated with a business
export const getCompaniesSocialMedia = async (req: AuthenticatedRequest, res: Response) => {
  // #variable - businessId, userId
  const businessId = req.params.id;
  const userId = req.user!.id;
  // #end-variable
  try {
    // #step 1 - Query the social media of the specified business
    const result = await pool.query(GET_COMPANY_SOCIALS, [businessId]);
    // #end-step
    // #step 2 - Check if social media was found or return an empty object
    if (result.rows.length === 0) {
      return res.status(200).json({ socials: {}, lastUpdate: null });
    }
    // #end-step
    // #step 3 - Format the data for the frontend
    const row = result.rows[0];
    const socials = {
      facebook_url: row.facebook_url || "",
      instagram_url: row.instagram_url || "",
      x_url: row.x_url || "",
      tiktok_url: row.tiktok_url || "",
      threads_url: row.threads_url || "",
    };
    // #end-step
    // #step 4 - Return the response with social media and last update date
    return res.status(200).json({ socials, lastUpdate: row.updated_at });
    // #end-step
  } catch (error) {
    // #step 5 - Exception handling
    return res.status(500).json({ error: "Error interno del servidor" });
    // #end-step
  }
};
// #end-function
// #function getCompanyLocation - Retrieves the location associated with a business
export const getCompanyLocation = async (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.params.id;
  try {
    const result = await pool.query(GET_COMPANY_LOCATION, [businessId]);
    if (result.rows.length === 0) {
      return res.status(200).json({ location: null, lastUpdate: null });
    }
    const row = result.rows[0];
    const location = {
      address: row.address || "",
      city: row.city || "",
      province: row.province || "",
    };
    return res.status(200).json({ location, lastUpdate: row.updated_at });
  } catch (error) {
    console.error("Error al obtener ubicación:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
// #end-function
// #function updateCompanyLocation - Updates the location of a business
export const updateCompanyLocation = async (req: AuthenticatedRequest, res: Response) => {
  const ownerId = req.user!.id;
  const businessId = Number(req.params.id);
  if (isNaN(businessId)) {
    console.error("ID de negocio inválido:", req.params.id);
    return res.status(400).json({ error: "ID de negocio inválido" });
  }
  const { address, city, province } = req.body;
  try {
    const verify = await pool.query(VERIFY_COMPANY_OWNERSHIP, [businessId, ownerId]);
    if (verify.rowCount === 0) {
      console.warn(`Negocio ${businessId} no pertenece al usuario ${ownerId}`);
      return res.status(403).json({ error: "Negocio no encontrado o sin permisos" });
    }
    const upsertQuery = UPSERT_COMPANY_LOCATION;
    const values = [businessId, address || null, city || null, province || null];
    await pool.query(upsertQuery, values);
    return res.status(200).json({ message: "Ubicación actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar ubicación:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
// #end-function
