// src\server.ts
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { inicializarBase } from "./db/init";
import userRouter from "./modules/users/users.routes";
import authRouter from "./modules/auth/auth.routes";
import businessRouter from "./modules/businesses/businesses.routes";

const app = express();
const PUERTO = 4000;

app.use(cors());
app.use(bodyParser.json());

app.use("/api/usuarios", userRouter);
app.use('/api/auth', authRouter);
app.use("/api/businesses", businessRouter);

app.get("/", (_req, res) => {
  res.send("Servidor activo.");
});

// Inicialización completa
inicializarBase().then(() => {
  app.listen(PUERTO, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${PUERTO}`);
  });
}).catch(err => {
  console.error("❌ Error inicializando base de datos:", err);
  process.exit(1);
});
