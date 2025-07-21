// src\modules\businesses\businesses.middlewares.ts

import { Response } from "express";
import { pool } from "../../db/pool";
import { AuthenticatedRequest } from "../auth/auth.types";

export const updateBusinessSocials = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    console.error("❌ Usuario no autenticado");
    return res.status(401).json({ error: "Usuario no autenticado" });
  }

  const ownerId = req.user.id;
  const businessId = Number(req.params.id);

  if (isNaN(businessId)) {
    console.error("❌ ID de negocio inválido:", req.params.id);
    return res.status(400).json({ error: "ID de negocio inválido" });
  }

  console.log("➡️ Actualizando redes sociales para negocio:", businessId);
  console.log("🧾 Datos recibidos:", req.body);

  const {
    facebook_url,
    instagram_url,
    x_url,
    tiktok_url,
    threads_url
  } = req.body;

  try {
    // Verificar propiedad del negocio
    const verify = await pool.query(
      `SELECT id FROM businesses WHERE id = $1 AND owner_id = $2`,
      [businessId, ownerId]
    );

    if (verify.rowCount === 0) {
      console.warn(`⚠️ El negocio ${businessId} no pertenece al usuario ${ownerId}`);
      return res.status(403).json({ error: "Negocio no encontrado o sin permisos" });
    }

    // UPSERT
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

    const values = [
      businessId,
      facebook_url || null,
      instagram_url || null,
      x_url || null,
      tiktok_url || null,
      threads_url || null
    ];

    console.log("💾 Ejecutando UPSERT con valores:", values);

    await pool.query(upsertQuery, values);

    console.log("✅ Redes sociales actualizadas con éxito");
    return res.status(200).json({ message: "Redes sociales actualizadas correctamente" });
  } catch (error) {
    console.error("❌ Error en la base de datos:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const createBusiness = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Usuario no autenticado" });
  }
  const ownerId = req.user.id;
  const { name, alias } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Nombre del negocio es obligatorio" });
  }

  try {
    const insertQuery = `
      INSERT INTO businesses (name, alias, owner_id)
      VALUES ($1, $2, $3)
      RETURNING id, name, alias, owner_id, created_at, updated_at, is_active
    `;

    const values = [name.trim(), alias?.trim() || null, ownerId];

    const result = await pool.query(insertQuery, values);

    const newBusiness = result.rows[0];

    return res.status(201).json({ business: newBusiness });
  } catch (error) {
    console.error("Error creando negocio:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};


export const getMyBusinesses = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Usuario no autenticado" });
  }

  const ownerId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, name, alias, created_at, updated_at, is_active FROM businesses WHERE owner_id = $1`,
      [ownerId]
    );

    return res.status(200).json({ businesses: result.rows });
  } catch (error) {
    console.error("Error obteniendo negocios:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getBusinessSocials = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    console.log("🔒 Usuario no autenticado");
    return res.status(401).json({ error: "Usuario no autenticado" });
  }

  const businessId = req.params.id;
  const userId = req.user.id;

  console.log("📥 Petición para obtener redes sociales");
  console.log("🔑 Business ID:", businessId);
  console.log("👤 User ID:", userId);

  try {
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

    console.log("📦 Resultado de query:", result.rows);

    if (result.rows.length === 0) {
      console.log("ℹ️ No se encontraron redes sociales para este negocio.");
      return res.status(200).json({ socials: {}, lastUpdate: null });
    }

    const row = result.rows[0];

    const socials = {
      facebook_url: row.facebook_url || "",
      instagram_url: row.instagram_url || "",
      x_url: row.x_url || "",
      tiktok_url: row.tiktok_url || "",
      threads_url: row.threads_url || "",
    };

    console.log("✅ Datos formateados para frontend:", socials);
    console.log("🕓 Última actualización:", row.updated_at);

    return res.status(200).json({ socials, lastUpdate: row.updated_at });
  } catch (error) {
    console.error("❌ Error obteniendo redes sociales:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
