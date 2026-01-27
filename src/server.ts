// src\server.ts
// #section Imports
import dotenv from 'dotenv';
dotenv.config();

// Validar variables de entorno críticas antes de cualquier otra cosa
import { validateEnvironment } from './config/environment';
validateEnvironment();

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from 'cookie-parser';
import { authRouter } from "./routes/auth.routes";
import { companyRouter } from "./routes/company.routes";
import devToolsRouter from "./routes/devTools.routes";
import { validateJWTMiddleware } from './middlewares/validators/validateJWT.middleware';
import * as serverConfig from './config/server.config';
import './db/init';
// #end-section

// #section Bootstrap
const app = express();

// #section Middlewares
app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: serverConfig.CORS_ORIGIN
}));
app.use(bodyParser.json());
// #end-section

// #section Routes
// Rutas públicas (sin JWT)
app.use('/api/auth', authRouter);

// Rutas protegidas (requieren JWT válido)
const dashboardRouter = express.Router();
dashboardRouter.use('/company', companyRouter);
dashboardRouter.use('/devtools', devToolsRouter);

app.use('/api/dashboard', validateJWTMiddleware, dashboardRouter);
// #end-section

app.get("/", (_req, res) => {
  res.send("Kitchen Solutions Suite Server - DevTools & Auth Ready");
});

// #section Error Handler - Global error handler middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🔥 Global Error Handler:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
// #end-section

// #section Start server
import { closeDatabase } from './db/init';

const server = app.listen(serverConfig.PORT, () => {
  console.log(`Server running on port ${serverConfig.PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
});
// #end-section
