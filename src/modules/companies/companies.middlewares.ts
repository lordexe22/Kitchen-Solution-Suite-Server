// src\modules\businesses\businesses.middlewares.ts
// #section Imports
import { Response } from "express";
import { pool } from "../../db/pool";
import { AuthenticatedRequest } from "../auth/auth.types";
// #end-section
// #function updateCompanySocialMedia - Actualiza los enlaces de redes sociales de un negocio específico.
export const updateCompanySocialMedia = async (req: AuthenticatedRequest, res: Response) => {
  // #variable - ownerId, businessId
  const ownerId = req.user!.id; // El ! indica que estamos seguros de que user no es undefined
  const businessId = Number(req.params.id);
  // #end-variable
  // #step 1 - Validar que el ID del negocio sea un número válido
  if (isNaN(businessId)) {
    console.error("❌ ID de negocio inválido:", req.params.id);
    return res.status(400).json({ error: "ID de negocio inválido" });
  }
  // #end-step
  // #step 2 - Capturar los enlaces de redes sociales del cuerpo de la solicitud
  const {
    facebook_url,
    instagram_url,
    x_url,
    tiktok_url,
    threads_url
  } = req.body;
  // #end-step
  try {
    // #step 3 - Verificar que el negocio pertenece al usuario autenticado
    const verify = await pool.query(
      `SELECT id FROM businesses WHERE id = $1 AND owner_id = $2`,
      [businessId, ownerId]
    );

    if (verify.rowCount === 0) {
      console.warn(`⚠️ El negocio ${businessId} no pertenece al usuario ${ownerId}`);
      return res.status(403).json({ error: "Negocio no encontrado o sin permisos" });
    }
    // #end-step
    // #step 4 - Crear una consulta SQL con un UPSERT para la tabla business_socials >> upsertQuery
    /* #note - Funcionamiento
    * 1 - El comando INSERT INTO con ON CONFLICT funciona de la siguiente manera:
    *   - Si el negocio no tiene redes sociales en la base de datos, se insertan los nuevos valores.
    *   - Si el negocio ya tiene redes sociales en la base de datos, se actualizan los campos correspondientes.
    * 2 - Utilizamos EXCLUDED para referirnos a los valores que se intentan insertar.
    */
    const upsertQuery = `
      INSERT INTO business_socials (
        business_id, facebook_url, instagram_url, x_url, tiktok_url, threads_url, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (business_id) DO UPDATE SET
        facebook_url = EXCLUDED.facebook_url,
        instagram_url = EXCLUDED.instagram_url,
        x_url = EXCLUDED.x_url,
        tiktok_url = EXCLUDED.tiktok_url,
        threads_url = EXCLUDED.threads_url,
        updated_at = NOW()
    `;
    // #end-step
    // #step 5 - Preparar los valores para el UPSERT >> values[]
    // #note - Un UPSERT es una operación que inserta un nuevo registro (si el mismo no existe) o actualiza uno existente.
    const values = [
      businessId,
      facebook_url || null,
      instagram_url || null,
      x_url || null,
      tiktok_url || null,
      threads_url || null
    ];
    // #end-step
    // #step 6 - Ejecutar la consulta de UPSERT
    await pool.query(upsertQuery, values);
    // #end-step
    // #step 7 - Retornar una respuesta exitosa
    return res.status(200).json({ message: "Redes sociales actualizadas correctamente" });
    // #end-step
  } catch (error:unknown) {
    // #step 8 - Manejo de excepciones
    console.error("❌ Error en la base de datos:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
    // #end-step
  }
};
// #end-function
// #function createCompany - Crea un nuevo negocio asociado al usuario autenticado y lo guarda en la base de datos.
export const createCompany = async (req: AuthenticatedRequest, res: Response) => {
  // #variable - ownerId, name, alias
  const ownerId = req.user!.id;
  const { name, alias } = req.body;
  // #end-variable
  // #step 1 - Validar que el nombre del negocio exista y sea un string
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Nombre del negocio es obligatorio" });
  }
  // #end-step
  try {
    // #step 2 - Prepara una consulta SQL para insertar el negocio en la base de datos
    const insertQuery = `
      INSERT INTO businesses (name, alias, owner_id)
      VALUES ($1, $2, $3)
      RETURNING id, name, alias, owner_id, created_at, updated_at, is_active
    `;
    // #end-step
    // #step 3 - Prepara valores para la consulta SQL
    const values = [name.trim(), alias?.trim() || null, ownerId];
    // #end-step
    // #step 4 - Ejecuta la consulta para insertar el negocio a la base de datos y obtener el negocio creado >> newBusiness
    const result = await pool.query(insertQuery, values);
    const newBusiness = result.rows[0];
    // #end-step
    // #step 5 - Retornar respuesta con el negocio creado
    return res.status(201).json({ business: newBusiness });
    // #end-step
  } catch (error: unknown) {
    // #step 6 - Manejo de excepciones
    return res.status(500).json({ error: "Error interno del servidor" });
    // #end-step
  }
};
// #end-function
// #function getMyCompanies - Obtiene todos los negocios asociados al usuario autenticado
export const getMyCompanies = async (req: AuthenticatedRequest, res: Response) => {
  // #variable - ownerId
  const ownerId = req.user!.id;
  // #end-variable
  try {
    // #step 1 - Consultar todos los negocios del usuario autenticado >> result
    const result = await pool.query(
      `SELECT id, name, alias, created_at, updated_at, is_active FROM businesses WHERE owner_id = $1`,
      [ownerId]
    );
    // #end-step
    // #step 2 - Devolver la lista de negocios
    return res.status(200).json({ businesses: result.rows });
    // #end-step
  } catch (error: unknown) {
    // #step 3 - Manejo de excepciones
    return res.status(500).json({ error: "Error interno del servidor" });
    // #end-step
  }
};
// #end-function
// #function getCompaniesSocialMedia - Obtiene las redes sociales asociadas a un negocio
export const getCompaniesSocialMedia = async (req: AuthenticatedRequest, res: Response) => {
  // #variable - businessId, userId
  const businessId = req.params.id;
  const userId = req.user!.id;
  // #end-variable
  try {
    // #step 1 - Consultar las redes sociales del negocio indicado
    const result = await pool.query(
      `
      SELECT 
        facebook_url,
        instagram_url,
        x_url,
        tiktok_url,
        threads_url,
        updated_at
      FROM business_socials
      WHERE business_id = $1
      `,
      [businessId]
    );
    // #end-step
    // #step 2 - Verificar si se encontraron redes sociales o retornar un objeto vacío
    if (result.rows.length === 0) {
      return res.status(200).json({ socials: {}, lastUpdate: null });
    }
    // #end-step
    // #step 3 - Formatear los datos para el frontend
    const row = result.rows[0];

    const socials = {
      facebook_url: row.facebook_url || "",
      instagram_url: row.instagram_url || "",
      x_url: row.x_url || "",
      tiktok_url: row.tiktok_url || "",
      threads_url: row.threads_url || "",
    };
    // #end-step
    // #step 4 - Retornar la respuesta con las redes sociales y la fecha de última actualización
    return res.status(200).json({ socials, lastUpdate: row.updated_at });
    // #end-step
  } catch (error) {
    // #step 5 - Manejo de excepciones
    return res.status(500).json({ error: "Error interno del servidor" });
    // #end-step
  }
};
// #end-function
// #function getCompanyLocation - Obtiene la ubicación asociada a un negocio
export const getCompanyLocation = async (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.params.id;
  const userId = req.user!.id;

  try {
    const result = await pool.query(
      `
      SELECT 
        address,
        city,
        province,
        updated_at
      FROM business_locations
      WHERE business_id = $1
      `,
      [businessId]
    );

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
// #function updateCompanyLocation - Actualiza la ubicación de un negocio
export const updateCompanyLocation = async (req: AuthenticatedRequest, res: Response) => {
  const ownerId = req.user!.id;
  const businessId = Number(req.params.id);

  if (isNaN(businessId)) {
    console.error("ID de negocio inválido:", req.params.id);
    return res.status(400).json({ error: "ID de negocio inválido" });
  }

  const { address, city, province } = req.body;

  try {
    // Verificar que el negocio pertenece al usuario autenticado
    const verify = await pool.query(
      `SELECT id FROM businesses WHERE id = $1 AND owner_id = $2`,
      [businessId, ownerId]
    );

    if (verify.rowCount === 0) {
      console.warn(`Negocio ${businessId} no pertenece al usuario ${ownerId}`);
      return res.status(403).json({ error: "Negocio no encontrado o sin permisos" });
    }

    // UPSERT ubicación
    const upsertQuery = `
      INSERT INTO business_locations (
        business_id, address, city, province, updated_at
      ) VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (business_id) DO UPDATE SET
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        province = EXCLUDED.province,
        updated_at = NOW()
    `;

    const values = [businessId, address || null, city || null, province || null];

    await pool.query(upsertQuery, values);

    return res.status(200).json({ message: "Ubicación actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar ubicación:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
// #end-function