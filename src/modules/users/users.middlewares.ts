import { Request, Response } from "express";
import { User } from "./users.types";
import { pool } from "../../db/pool";

// #middleware registerUser - Add a new user into the database
export const registerUser = async (req: Request, res: Response) => {
  const user: User = req.body;
  try {
    // #step 1 - save user data into the pgSQL database
    const queryResult = await pool.query(`
      INSERT INTO users
      (name, email, password, phone, company_name, register_date, role, account_status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id
    `, [
      user.name,
      user.email,
      user.password,
      user.phone || null,
      user.companyName || null,
      user.registerDate,
      user.role,
      user.accountStatus,
    ]);
    // #end-step
    // #step 2 - return user id and success message to the client
    return res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      id: queryResult.rows[0].id,
    });
    // #end-step
  } catch (error: any) {
    // #step 3 - handle exceptions
    console.error("❌ Error al registrar usuario:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
    // #end-step
  }
};
// #end-middleware
// #middleware - Eval if current user exist into the database
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // #step 1 - Search into the database if the current user exists
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

    console.log("✔ Usuario autenticado:", usuario);
    // #end-step
    // #step 2 - Return existing user data
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
    // #end-step
  } catch (error: any) {
    // #step 3 - handle exceptions
    console.error("❌ Error en login:", error.message);
    return res.status(500).json({ success: false, message: "Error interno del servidor." });
    // #end-step
  }
};
// #end-middleware
