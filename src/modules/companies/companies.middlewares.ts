/* src\modules\companies\companies.middlewares.ts */
// #section Imports
import { Response } from "express";
import { pool } from "../../db/pool";
import { AuthenticatedRequest } from "../jwtManager/jwtManager.types";
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
// #middleware updateCompanySocialMedia - Updates the social media links of a specific company.
export const updateCompanySocialMedia = async (req: AuthenticatedRequest, res: Response) => {
  // #variable - ownerId, businessId
  const ownerId = req.user!.userId; // El ! indica que estamos seguros de que user no es undefined
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
// #end-middleware
// #middleware createCompany - Creates a new company associated with the authenticated user and stores it in the database.
export const createCompany = async (req: AuthenticatedRequest, res: Response) => {
  // #variable - ownerId, name, alias
  const ownerId = req.user!.userId;
  const { name, alias, logo_url } = req.body;
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
    const values = [name.trim(), alias?.trim() || null, ownerId, logo_url?.trim() || null];
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
// #end-middleware
// #middleware getMyCompanies - Retrieves all companies associated with the authenticated user
export const getMyCompanies = async (req: AuthenticatedRequest, res: Response) => {
  // #variable - ownerId
  const ownerId = req.user!.userId;
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
// #end-middleware
// #middleware getCompaniesSocialMedia - Retrieves the social media associated with a company
export const getCompaniesSocialMedia = async (req: AuthenticatedRequest, res: Response) => {
  // #variable - businessId, userId
  const businessId = req.params.id;
  const userId = req.user!.userId;
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
// #end-middleware
// #middleware getCompanyLocation - Retrieves the location associated with a company
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
// #end-middleware
// #middleware updateCompanyLocation - Updates the location of a company
export const updateCompanyLocation = async (req: AuthenticatedRequest, res: Response) => {
  const ownerId = req.user!.userId;
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
// #end-middleware
// #middleware getCompanySchedule - Retrieves the schedule associated with a company
export const getCompanySchedule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.userId;
    const companyId = Number(req.params.id);

    // 1. Verificar que la compañía pertenezca al usuario
    const companyCheck = await pool.query(
      `SELECT id FROM companies WHERE id = $1 AND owner_id = $2`,
      [companyId, ownerId]
    );
    if (companyCheck.rowCount === 0) {
      return res.status(403).json({ message: "No tienes permiso para ver esta compañía" });
    }

    // 2. Buscar el horario
    const scheduleResult = await pool.query(
      `SELECT schedule FROM company_schedules WHERE company_id = $1`,
      [companyId]
    );

    if (scheduleResult.rowCount === 0) {
      // Cambiar el 404 por un 200 con horario vacío por defecto
      return res.status(200).json({
        monday: { isClosed: false, turns: [] },
        tuesday: { isClosed: false, turns: [] },
        wednesday: { isClosed: false, turns: [] },
        thursday: { isClosed: false, turns: [] },
        friday: { isClosed: false, turns: [] },
        saturday: { isClosed: false, turns: [] },
        sunday: { isClosed: false, turns: [] },
      });
    }

    // 3. Retornar el objeto JSON tal cual se guardó
    return res.status(200).json(scheduleResult.rows[0].schedule);

  } catch (error) {
    console.error("Error obteniendo horario:", error);
    return res.status(500).json({ message: "Error al obtener el horario" });
  }
};
// #end-middleware
// #middleware updateCompanySchedule - Updates the weekly schedule of a company
export const updateCompanySchedule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.userId;
    const companyId = Number(req.params.id);
    const schedule = req.body; // Ya llega en formato WeeklySchedule

    // 1. Verificar que la compañía pertenezca al usuario
    const companyCheck = await pool.query(
      `SELECT id FROM companies WHERE id = $1 AND owner_id = $2`,
      [companyId, ownerId]
    );
    if (companyCheck.rowCount === 0) {
      return res.status(403).json({ message: "No tienes permiso para modificar esta compañía" });
    }

    // 2. Insertar o actualizar el horario
    await pool.query(
      `
      INSERT INTO company_schedules (company_id, schedule, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT (company_id)
      DO UPDATE SET schedule = EXCLUDED.schedule, updated_at = NOW()
      `,
      [companyId, schedule]
    );

    // 3. Responder éxito
    return res.status(200).json({ message: "Horarios actualizados correctamente" });

  } catch (error) {
    console.error("Error actualizando horario:", error);
    return res.status(500).json({ message: "Error al actualizar horarios" });
  }
};
// #end-middleware
// #middleware getCompanySchedule - Retrieves the schedule associated with a company
export const getCompanyBasicData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.userId;
    const companyId = Number(req.params.id);

    // #step 1 - Verify that the company allows to the current userID
    const companyCheck = await pool.query(
      `SELECT id FROM companies WHERE id = $1 AND owner_id = $2`,
      [companyId, ownerId]
    );
    if (companyCheck.rowCount === 0) {
      return res.status(403).json({ message: "No tienes permiso para ver esta compañía" });
    }
    // #end-step

    // #step 2 - Get the company basic data
    const result = await pool.query(
      `SELECT id, name, alias, logo_url
       FROM companies
       WHERE id = $1`,
      [companyId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Compañía no encontrada" });
    }
    const companyData = result.rows[0];
    // #end-step

    // #step 3 - Return the company basic data
    console.log({companyData});
    return res.status(200).json(companyData);
    // #end-step

  } catch (error) {
    console.error("Error obteniendo la información base de la empresa:", error);
    return res.status(500).json({ message: "Error al obtener la información base de la empresa" });
  }
};
// #end-middleware
// #middleware updateCompanySchedule - Updates the weekly schedule of a company
export const updateCompanyBasicData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.userId;
    const companyId = Number(req.params.id);
    const { name, alias, logo_url } = req.body;

    // Construir un array dinámico de campos y valores para actualizar
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      values.push(name);
      fieldsToUpdate.push(`name = $${values.length}`);
    }
    if (alias !== undefined) {
      values.push(alias);
      fieldsToUpdate.push(`alias = $${values.length}`);
    }
    if (logo_url !== undefined) {
      values.push(logo_url);
      fieldsToUpdate.push(`logo_url = $${values.length}`);
    }

    // Siempre actualizar updated_at a NOW()
    fieldsToUpdate.push(`updated_at = NOW()`);

    if (fieldsToUpdate.length === 1) {
      // Solo updated_at, sin cambios en datos, no hacer nada
      return res.status(400).json({ message: "No se recibieron datos para actualizar" });
    }

    // Agregar condiciones para actualizar sólo si owner_id y companyId coinciden
    // Añadir companyId y ownerId a values
    values.push(companyId);
    values.push(ownerId);

    const query = `
      UPDATE companies
      SET ${fieldsToUpdate.join(", ")}
      WHERE id = $${values.length - 1} AND owner_id = $${values.length}
      RETURNING id, name, alias, logo_url, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Empresa no encontrada o no autorizada" });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error("Error actualizando datos de la empresa:", error);
    return res.status(500).json({ message: "Error al actualizar datos de la empresa" });
  }
};
// #end-middleware
