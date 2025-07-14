// src\server.ts
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { inicializarBase } from "./db/init";
import rutasUsuarios from "./routes/usuarios";

const app = express();
const PUERTO = 4000;

app.use(cors());
app.use(bodyParser.json());

app.use("/api/usuarios", rutasUsuarios);

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
