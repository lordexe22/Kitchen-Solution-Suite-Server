/* src/routes/devTools.routes.ts */

// #section Imports
import { Router } from 'express';
import * as devToolsController from '../controllers/devTools.controller';
// #end-section

// #info
/**
 * Router de DevTools para operaciones CRUD agnósticas.
 * 
 * Endpoints:
 * - GET    /api/devtools/tables              Lista tablas disponibles
 * - GET    /api/devtools/tables/:table/schema Obtiene schema de tabla
 * - POST   /api/devtools/:table              Crea registro
 * - GET    /api/devtools/:table              Lista registros (con filtros)
 * - GET    /api/devtools/:table/:id          Obtiene registro por ID
 * - PUT    /api/devtools/:table/:id          Actualiza registro
 * - DELETE /api/devtools/:table/:id          Elimina registro
 * 
 * Nota: Sin validaciones de negocio por ahora. Se agregarán middlewares después.
 */
// #end-info

// #section Router
const router = Router();

// Listar tablas disponibles
router.get('/tables', devToolsController.listTables);

// Obtener schema de una tabla
router.get('/tables/:table/schema', devToolsController.getTableSchema);

// CRUD por tabla
router.post('/:table', devToolsController.createRecord);
router.get('/:table', devToolsController.getRecords);
router.get('/:table/:id', devToolsController.getRecordById);
router.put('/:table/:id', devToolsController.updateRecord);
router.delete('/:table/:id', devToolsController.deleteRecord);
// #end-section

export default router;
