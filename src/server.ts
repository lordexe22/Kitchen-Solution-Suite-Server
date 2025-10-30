// src\server.ts
// #section Imports
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { authRouter } from "./routes/index.routes";
import { db } from "./db/init";
import * as serverConfig from './config/server.config'
// #end-section


const app = express();

// #section Use server middlewares
app.use(cors({
  credentials: true, // permitir el uso de cookies
  origin: 'http://localhost:5173' // ajustar al origen del cliente (quien recibira las cookies)
}));
app.use(bodyParser.json());
app.use(authRouter);
// #end-section

app.get("/", (_req, res) => {
  res.send("Servidor activo.");
});


// #section Start server
app.listen(serverConfig.PORT, ()=>{console.log(`Server running on port ${serverConfig.PORT}`)})
// #end-section
