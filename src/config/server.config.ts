// src/config/server.config.ts
// #const PORT - Server port from environment or default 3000
export const PORT = process.env.PORT || 3000;
// #end-const

// #const CORS_ORIGIN - Client URL for CORS configuration
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
// #end-const
