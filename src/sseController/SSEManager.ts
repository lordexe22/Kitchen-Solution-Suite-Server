// #module SSEManager - Gestión de conexiones y envío de eventos SSE
// Módulo desacoplado y reutilizable para Server-Sent Events

import { Request, Response } from 'express';

// #type SSEMessage - Contrato de mensaje SSE
export interface SSEMessage {
  type: string;
  payload: Record<string, any>;
  recipients: string[]; // IDs de usuarios destino
}
// #end-type

// #type SSEClient - Representa una conexión SSE activa
interface SSEClient {
  id: string; // ID único del usuario
  response: Response;
}
// #end-type

// #class SSEManager - Maneja conexiones y envío de eventos SSE
export class SSEManager {
  private clients: Map<string, SSEClient> = new Map();

  /**
   * Registra una nueva conexión SSE
   * @param id ID único del usuario
   * @param res Response de Express
   */
  addClient(id: string, res: Response): void {
    this.clients.set(id, { id, response: res });
  }

  /**
   * Elimina una conexión SSE
   * @param id ID único del usuario
   */
  removeClient(id: string): void {
    this.clients.delete(id);
  }

  /**
   * Envía un mensaje SSE a uno o varios destinatarios
   * @param message Mensaje SSE
   */
  send(message: SSEMessage): void {
    message.recipients.forEach((recipientId) => {
      const client = this.clients.get(recipientId);
      if (client) {
        client.response.write(`data: ${JSON.stringify({ type: message.type, payload: message.payload })}\n\n`);
      }
    });
  }

  /**
   * Envía un mensaje SSE a todos los clientes conectados
   * @param message Mensaje SSE
   */
  broadcast(message: Omit<SSEMessage, 'recipients'> & { recipients?: undefined }): void {
    this.clients.forEach((client) => {
      client.response.write(`data: ${JSON.stringify({ type: message.type, payload: message.payload })}\n\n`);
    });
  }

  /**
   * Devuelve el número de clientes conectados
   */
  getClientCount(): number {
    return this.clients.size;
  }
}
// #end-class

// #end-module
