// src\modules\businesses\businesses.middlewares.ts

import { Response } from "express";
import { pool } from "../../db/pool";
import { AuthenticatedRequest } from "../auth/auth.types";

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