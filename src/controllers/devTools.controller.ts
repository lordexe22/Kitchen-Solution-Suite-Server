/* src/controllers/devTools.controller.ts */

// #section Imports
import { Request, Response } from 'express';
import * as devToolsService from '../services/devTools/databaseCrud';
// #end-section

// #info
/**
 * Controllers para DevTools CRUD.
 * 
 * Responsabilidades:
 * - Recibir requests HTTP
 * - Extraer parámetros (tabla, id, data, filtros)
 * - Llamar servicios CRUD
 * - Retornar respuestas HTTP apropiadas
 * 
 * NO incluye validaciones de negocio (se agregarán después en middlewares).
 */
// #end-info

// #controller listTables
/**
 * Lista todas las tablas disponibles en el schema.
 * 
 * GET /api/devtools/tables
 */
export async function listTables(req: Request, res: Response) {
  try {
    const tables = devToolsService.getAvailableTables();
    
    return res.status(200).json({
      success: true,
      data: tables,
      metadata: {
        count: tables.length,
        timestamp: new Date()
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({
      success: false,
      error: `Error al listar tablas: ${errorMessage}`
    });
  }
}
// #end-controller

// #controller getTableSchema
/**
 * Obtiene el schema de una tabla específica.
 * 
 * GET /api/devtools/tables/:table/schema
 */
export async function getTableSchema(req: Request, res: Response) {
  try {
    const { table } = req.params;
    const schema = devToolsService.getTableSchema(table);
    
    if (!schema) {
      return res.status(404).json({
        success: false,
        error: `Tabla no encontrada: ${table}`
      });
    }
    
    return res.status(200).json({
      success: true,
      data: schema,
      metadata: {
        timestamp: new Date()
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({
      success: false,
      error: `Error al obtener schema: ${errorMessage}`
    });
  }
}
// #end-controller

// #controller createRecord
/**
 * Crea un nuevo registro en la tabla especificada.
 * 
 * POST /api/devtools/:table
 * Body: { campo1: valor1, campo2: valor2, ... }
 */
export async function createRecord(req: Request, res: Response) {
  try {
    const { table } = req.params;
    const data = req.body;
    
    const result = await devToolsService.createRecord(table, data);
    
    if (result.success) {
      return res.status(201).json(result);
    }
    
    return res.status(400).json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${errorMessage}`
    });
  }
}
// #end-controller

// #controller getRecords
/**
 * Lee registros de una tabla con filtros opcionales.
 * 
 * GET /api/devtools/:table?campo1=valor1&campo2=valor2
 */
export async function getRecords(req: Request, res: Response) {
  try {
    const { table } = req.params;
    const filters = req.query;
    
    // Convertir query params a filtros
    const filterObj = Object.keys(filters).length > 0 
      ? filters as Record<string, any>
      : undefined;
    
    const result = await devToolsService.readRecords(table, filterObj);
    
    if (result.success) {
      return res.status(200).json(result);
    }
    
    return res.status(400).json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${errorMessage}`
    });
  }
}
// #end-controller

// #controller getRecordById
/**
 * Lee un registro específico por ID.
 * 
 * GET /api/devtools/:table/:id
 */
export async function getRecordById(req: Request, res: Response) {
  try {
    const { table, id } = req.params;
    
    // Convertir id a número si es posible
    const recordId = isNaN(Number(id)) ? id : Number(id);
    
    const result = await devToolsService.readRecordById(table, recordId);
    
    if (result.success) {
      return res.status(200).json(result);
    }
    
    return res.status(404).json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${errorMessage}`
    });
  }
}
// #end-controller

// #controller updateRecord
/**
 * Actualiza un registro específico.
 * 
 * PUT /api/devtools/:table/:id
 * Body: { campo1: nuevoValor1, campo2: nuevoValor2, ... }
 */
export async function updateRecord(req: Request, res: Response) {
  try {
    const { table, id } = req.params;
    const data = req.body;
    
    // Convertir id a número si es posible
    const recordId = isNaN(Number(id)) ? id : Number(id);
    
    const result = await devToolsService.updateRecord(table, recordId, data);
    
    if (result.success) {
      return res.status(200).json(result);
    }
    
    return res.status(400).json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${errorMessage}`
    });
  }
}
// #end-controller

// #controller deleteRecord
/**
 * Elimina un registro específico.
 * 
 * DELETE /api/devtools/:table/:id
 */
export async function deleteRecord(req: Request, res: Response) {
  try {
    const { table, id } = req.params;
    
    // Convertir id a número si es posible
    const recordId = isNaN(Number(id)) ? id : Number(id);
    
    const result = await devToolsService.deleteRecord(table, recordId);
    
    if (result.success) {
      return res.status(200).json(result);
    }
    
    return res.status(404).json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({
      success: false,
      error: `Error interno del servidor: ${errorMessage}`
    });
  }
}
// #end-controller
