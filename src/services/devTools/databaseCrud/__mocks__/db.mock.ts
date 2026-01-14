/* src/services/devTools/databaseCrud/__mocks__/db.mock.ts */

/**
 * Mock de la base de datos para testing.
 * Simula el comportamiento de drizzle-orm sin conexión real a la BD.
 */

// #section Mock Data
export const mockUsers = [
  {
    id: 1,
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@test.com',
    passwordHash: 'hash123',
    type: 'admin',
    isActive: true,
    state: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 2,
    firstName: 'María',
    lastName: 'González',
    email: 'maria@test.com',
    passwordHash: 'hash456',
    type: 'client',
    isActive: true,
    state: 'active',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  },
  {
    id: 3,
    firstName: 'Pedro',
    lastName: 'Ramírez',
    email: 'pedro@test.com',
    passwordHash: 'hash789',
    type: 'client',
    isActive: false,
    state: 'inactive',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03')
  }
];

export const mockProducts = [
  {
    id: 1,
    name: 'Laptop Dell',
    description: 'Laptop para desarrollo',
    price: 1200.00,
    stock: 10,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 2,
    name: 'Mouse Logitech',
    description: 'Mouse inalámbrico',
    price: 25.00,
    stock: 50,
    isActive: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  }
];

// Base de datos mock en memoria
export const mockDatabase: Record<string, any[]> = {
  users: [...mockUsers],
  products: [...mockProducts]
};
// #end-section

// #section Mock Query Builder
/**
 * Simula el query builder de Drizzle ORM
 */
export class MockQueryBuilder {
  private tableName: string;
  private table: any;
  private whereCondition: any = null;
  private selectFields: string[] = [];
  private insertData: any = null;

  constructor(table: any, tableName: string) {
    this.table = table;
    this.tableName = tableName;
  }

  select() {
    return this;
  }

  from(table: any) {
    this.tableName = (table as any)._tableName || this.tableName;
    return this;
  }

  where(condition: any) {
    this.whereCondition = condition;
    return this;
  }

  async execute(): Promise<any[]> {
    const data = mockDatabase[this.tableName] || [];
    
    if (!this.whereCondition) {
      return [...data];
    }

    // Simular filtrado basado en la condición
    return data.filter((record: any) => {
      return evaluateCondition(record, this.whereCondition);
    });
  }

  // Para insert
  values(data: any) {
    this.insertData = data;
    return this;
  }

  async returning() {
    if (!this.insertData) {
      return [];
    }

    const newId = (mockDatabase[this.tableName]?.length || 0) + 1;
    const newRecord = {
      id: newId,
      ...this.insertData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (!mockDatabase[this.tableName]) {
      mockDatabase[this.tableName] = [];
    }
    
    mockDatabase[this.tableName].push(newRecord);
    return [newRecord];
  }
}

/**
 * Evalúa una condición where contra un registro
 */
function evaluateCondition(record: any, condition: any): boolean {
  if (!condition) return true;
  
  // Si es una función (como eq(), and(), etc), evaluarla
  if (typeof condition === 'function') {
    try {
      return condition(record);
    } catch (e) {
      return true;
    }
  }
  
  // Si es un objeto simple, hacer matching de campos
  if (typeof condition === 'object') {
    // Buscar propiedades que tengan un valor específico
    for (const key in condition) {
      if (record[key] !== condition[key]) {
        return false;
      }
    }
    return true;
  }
  
  return true;
}
// #end-section

// #section Mock DB Object
/**
 * Mock del objeto db de drizzle
 */
export const mockDb = {
  select: () => {
    return {
      from: (table: any) => {
        const tableName = getTableName(table);
        return new MockQueryBuilder(table, tableName);
      }
    };
  },

  insert: (table: any) => {
    const tableName = getTableName(table);
    return {
      values: (data: any) => ({
        returning: async () => {
          const newId = (mockDatabase[tableName]?.length || 0) + 1;
          const newRecord = {
            id: newId,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          if (!mockDatabase[tableName]) {
            mockDatabase[tableName] = [];
          }
          
          mockDatabase[tableName].push(newRecord);
          return [newRecord];
        }
      })
    };
  },

  update: (table: any) => {
    const tableName = getTableName(table);
    return {
      set: (data: any) => ({
        where: (condition: any) => ({
          returning: async () => {
            const records = mockDatabase[tableName] || [];
            const id = extractIdFromCondition(condition);
            
            const index = records.findIndex((r: any) => r.id === id);
            if (index === -1) return [];
            
            const updated = {
              ...records[index],
              ...data,
              updatedAt: new Date()
            };
            
            mockDatabase[tableName][index] = updated;
            return [updated];
          }
        })
      })
    };
  },

  delete: (table: any) => {
    const tableName = getTableName(table);
    return {
      where: (condition: any) => ({
        returning: async () => {
          const records = mockDatabase[tableName] || [];
          const id = extractIdFromCondition(condition);
          
          const index = records.findIndex((r: any) => r.id === id);
          if (index === -1) return [];
          
          const deleted = records[index];
          mockDatabase[tableName].splice(index, 1);
          return [deleted];
        }
      })
    };
  }
};
// #end-section

// #section Helper Functions
/**
 * Extrae el nombre de la tabla desde el objeto table
 */
function getTableName(table: any): string {
  // Simulación simple - en realidad Drizzle tiene su propia forma
  if (table._tableName) return table._tableName;
  return 'users'; // Default para testing
}

/**
 * Extrae el ID desde una condición where
 */
function extractIdFromCondition(condition: any): number {
  // Simulación simple - en tests reales esto sería más complejo
  if (condition && condition._id) return condition._id;
  return 1; // Default para testing
}

/**
 * Resetea la base de datos mock a su estado inicial
 */
export function resetMockDatabase() {
  mockDatabase.users = [...mockUsers];
  mockDatabase.products = [...mockProducts];
}

/**
 * Limpia completamente la base de datos mock
 */
export function clearMockDatabase() {
  Object.keys(mockDatabase).forEach(key => {
    mockDatabase[key] = [];
  });
}
// #end-section
