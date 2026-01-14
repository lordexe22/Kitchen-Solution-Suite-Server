/* src/services/devTools/databaseCrud/__mocks__/schema.mock.ts */

/**
 * Mock del schema de la base de datos para testing.
 * Simula las tablas sin necesidad de conexión real.
 */

// #section Mock Table Objects
/**
 * Mock de la tabla users
 */
export const usersTable = {
  _tableName: 'users',
  id: { name: 'id', dataType: 'number' },
  firstName: { name: 'firstName', dataType: 'string' },
  lastName: { name: 'lastName', dataType: 'string' },
  email: { name: 'email', dataType: 'string' },
  passwordHash: { name: 'passwordHash', dataType: 'string' },
  type: { name: 'type', dataType: 'string' },
  isActive: { name: 'isActive', dataType: 'boolean' },
  state: { name: 'state', dataType: 'string' },
  createdAt: { name: 'createdAt', dataType: 'date' },
  updatedAt: { name: 'updatedAt', dataType: 'date' }
};

/**
 * Mock de la tabla products
 */
export const productsTable = {
  _tableName: 'products',
  id: { name: 'id', dataType: 'number' },
  name: { name: 'name', dataType: 'string' },
  description: { name: 'description', dataType: 'string' },
  price: { name: 'price', dataType: 'number' },
  stock: { name: 'stock', dataType: 'number' },
  isActive: { name: 'isActive', dataType: 'boolean' },
  createdAt: { name: 'createdAt', dataType: 'date' },
  updatedAt: { name: 'updatedAt', dataType: 'date' }
};

/**
 * Mock de la tabla orders
 */
export const ordersTable = {
  _tableName: 'orders',
  id: { name: 'id', dataType: 'number' },
  userId: { name: 'userId', dataType: 'number' },
  total: { name: 'total', dataType: 'number' },
  status: { name: 'status', dataType: 'string' },
  createdAt: { name: 'createdAt', dataType: 'date' },
  updatedAt: { name: 'updatedAt', dataType: 'date' }
};
// #end-section

// #section Schema Export
/**
 * Schema mock que simula el objeto schema real
 */
export const mockSchema = {
  usersTable,
  productsTable,
  ordersTable
};
// #end-section

// #section Available Tables List
/**
 * Lista de tablas disponibles (simula getAvailableTables)
 */
export const availableTables = ['users', 'products', 'orders'];
// #end-section
