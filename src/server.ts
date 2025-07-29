// src\server.ts
// #section Imports
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { initializeDatabase } from "./db/init";
import userRouter from "./modules/users/users.routes";
import authRouter from "./modules/auth/auth.routes";
import companiesRouter from "./modules/companies/companies.routes";
// #end-section

const app = express();
const PUERTO = 4000;

// #section Use server middlewares
app.use(cors());
app.use(bodyParser.json());
app.use("/api/usuarios", userRouter);
app.use('/api/auth', authRouter);
app.use("/api/companies", companiesRouter);
// #end-section

app.get("/", (_req, res) => {
  res.send("Servidor activo.");
});


// #section Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PUERTO, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${PUERTO}`);
  });
}).catch(err => {
  console.error("❌ Error inicializando base de datos:", err);
  process.exit(1);
});
// #end-section
