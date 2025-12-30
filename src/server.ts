// src\server.ts
// #section Imports
import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { authRouter } from "./routes/auth.routes";
import { companiesRouter } from './routes/companies.routes';
import { branchesRouter } from './routes/branch.routes';
import { usersRouter }  from './routes/users.routes';
import { categoriesRouter } from './routes/categories.routes';
import { productsRouter } from './routes/products.routes';
import { publicRouter } from './routes/public.routes';
import employeesRouter from './routes/employees.routes';
import invitationsRouter from './routes/invitations.routes';
import * as serverConfig from './config/server.config'
import cookieParser from 'cookie-parser';
import './db/init';
// #end-section
// #section Get env variables
// #const CORS_ORIGIN - origen permitido para CORS
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
// #end-const
// #end-section
// #section Use server middlewares
const app = express(); // Crear instancia de Express
app.use(cookieParser()); // Middleware para parsear cookies
app.use(cors({
  credentials: true, // permite el uso de cookies
  origin: CORS_ORIGIN // define la ulr de origen del cliente (quien recibira las cookies)
})); // Configuración de CORS 
app.use(bodyParser.json()); // Middleware para parsear JSON en body
// #end-section
// #section User server's routes
app.use('/api/auth', authRouter); // auth routes
app.use('/api/companies', companiesRouter);
app.use('/api/branches', branchesRouter); 
app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/public', publicRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/invitations', invitationsRouter);
// #end-section

app.get("/", (_req, res) => {
  res.send("Servidor activo.");
});


// #section Start server
app.listen(serverConfig.PORT, ()=>{console.log(`Server running on port ${serverConfig.PORT}`)})
// #end-section
