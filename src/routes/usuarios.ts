// src\routes\usuarios.ts

import { Router, Request, Response } from "express";
import { pool } from "../db/pool";

const router = Router();

// #typedef UsuarioRegistro
interface UsuarioRegistro {
  name: string;
  email: string;
  password: string;
  phone?: string;
  companyName?: string;
  registerDate: string;
  role: "admin";
  accountStatus: "free";
}
// #end-typedef

router.post("/registrar", async (req: Request, res: Response) => {
  const usuario: UsuarioRegistro = req.body;

  try {
    const resultado = await pool.query(`
      INSERT INTO users
      (name, email, password, phone, company_name, register_date, role, account_status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id
    `, [
      usuario.name,
      usuario.email,
      usuario.password,
      usuario.phone || null,
      usuario.companyName || null,
      usuario.registerDate,
      usuario.role,
      usuario.accountStatus,
    ]);

    return res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      id: resultado.rows[0].id,
    });

  } catch (error: any) {
    console.error("❌ Error al registrar usuario:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const resultado = await pool.query(`
      SELECT id, name, email, password, role FROM users WHERE email = $1
    `, [email]);

    if (resultado.rowCount === 0) {
      return res.status(401).json({ success: false, message: "Correo no registrado." });
    }

    const usuario = resultado.rows[0];

    if (usuario.password !== password) {
      return res.status(401).json({ success: false, message: "Contraseña incorrecta." });
    }

    // Aquí podrías generar y devolver un token (opcional, más adelante)
    return res.status(200).json({
      success: true,
      message: "Login exitoso.",
      user: {
        id: usuario.id,
        name: usuario.name,
        email: usuario.email,
        role: usuario.role,
      }
    });

  } catch (error: any) {
    console.error("❌ Error en login:", error.message);
    return res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
});


export default router;
