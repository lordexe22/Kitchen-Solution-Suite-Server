import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { User } from "./users.types";
import { pool } from "../../db/pool";


// #middleware registerUser - Add a new user into the database
export const registerUser = async (req: Request, res: Response) => {
  const user: User = req.body;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(user.password, saltRounds);
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
      hashedPassword,
      user.phone || null,
      user.companyName || null,
      user.registerDate,
      user.role,
      user.accountStatus,
    ]);
    // #end-step
    // #step 2 - return message to client
    return res.status(201).json({
      mensaje: "Usuario registrado correctamente",
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
// #middleware loginUser - Eval if current user exist into the database
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    // #step 1 - Search into the database if the current user exists by email
    const resultado = await pool.query(`
      SELECT id, name, email, password, role FROM users WHERE email = $1
    `, [email]);

    if (resultado.rowCount === 0) {
      return res.status(401).json({ success: false, message: "Correo no registrado." });
    }

    const usuario = resultado.rows[0];
    // #end-step
    // #step 2 - Compare by password using bcrypt
    const passwordValid = await bcrypt.compare(password, usuario.password);
    if (!passwordValid) {
      return res.status(401).json({ success: false, message: "Contraseña incorrecta." });
    }
    // #end-step
    // #step 3 - Create jwt
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );
    // #end-step
    // #step 4 - Return jwt and success message
    return res.status(200).json({
      success: true,
      message: "Login exitoso.",
      token,
      user: {
        id: usuario.id,
        name: usuario.name,
        email: usuario.email,
        role: usuario.role,
      }
    });
    // #end-step

  } catch (error: any) {
    // #step 5 - handle exceptions
    console.error("❌ Error en login:", error.message);
    return res.status(500).json({ success: false, message: "Error interno del servidor." });
    // #end-step
  }
};
// #end-middleware
