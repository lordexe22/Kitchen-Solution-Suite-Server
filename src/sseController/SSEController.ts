// #module SSEController - Controlador Express para SSE
// Expone endpoints para conexión y pruebas de envío de eventos

import { Request, Response } from 'express';
import { SSEManager, SSEMessage } from './SSEManager';

const sseManager = new SSEManager();

/**
 * Endpoint para que un cliente se conecte vía SSE
 * Requiere ?userId=ID como query param (puede adaptarse a JWT en producción)
 */
export function sseStreamHandler(req: Request, res: Response) {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).end('Missing userId');
    return;
  }

  // Configurar headers SSE
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  sseManager.addClient(userId, res);

  // Limpiar conexión al cerrar
  req.on('close', () => {
    sseManager.removeClient(userId);
  });
}

/**
 * Endpoint para enviar un mensaje SSE a uno o varios usuarios
 * Body: { type, payload, recipients }
 */
export function sseSendHandler(req: Request, res: Response) {
  const message = req.body as SSEMessage;
  if (!message || !message.type || !message.payload || !Array.isArray(message.recipients)) {
    res.status(400).json({ error: 'Invalid message format' });
    return;
  }
  sseManager.send(message);
  res.json({ ok: true });
}

/**
 * Endpoint para broadcast a todos los clientes
 * Body: { type, payload }
 */
export function sseBroadcastHandler(req: Request, res: Response) {
  const { type, payload } = req.body;
  if (!type || !payload) {
    res.status(400).json({ error: 'Invalid message format' });
    return;
  }
  sseManager.broadcast({ type, payload });
  res.json({ ok: true });
}

export { sseManager };
// #end-module
