/**
 * Tests para table-schema.service.ts
 * 
 * Verifica que la extracción de schema funcione correctamente
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { extractTableSchema, extractFieldInfo, validateTableSchema } from './table-schema.service';
import { usersTable } from '../../../db/schema';

describe('Table Schema Service', () => {
  describe('extractTableSchema', () => {
    it('debe extraer schema completo de la tabla users', () => {
      const schema = extractTableSchema(usersTable, 'users');

      expect(schema).toBeDefined();
      expect(schema.tableName).toBe('users');
      expect(Array.isArray(schema.fields)).toBe(true);
      expect(schema.fields.length).toBeGreaterThan(0);
    });

    it('debe incluir campos esperados de la tabla users', () => {
      const schema = extractTableSchema(usersTable, 'users');
      const fieldNames = schema.fields.map(f => f.name);

      expect(fieldNames).toContain('id');
      expect(fieldNames).toContain('email');
      expect(fieldNames).toContain('firstName');
      expect(fieldNames).toContain('lastName');
      expect(fieldNames).toContain('passwordHash');
      expect(fieldNames).toContain('type');
      expect(fieldNames).toContain('createdAt');
    });

    it('debe marcar id como clave primaria', () => {
      const schema = extractTableSchema(usersTable, 'users');
      const idField = schema.fields.find(f => f.name === 'id');

      expect(idField).toBeDefined();
      expect(idField?.isPrimaryKey).toBe(true);
    });

    it('debe marcar email como único', () => {
      const schema = extractTableSchema(usersTable, 'users');
      const emailField = schema.fields.find(f => f.name === 'email');

      expect(emailField).toBeDefined();
      expect(emailField?.isUnique).toBe(true);
    });

    it('debe marcar campos requeridos correctamente', () => {
      const schema = extractTableSchema(usersTable, 'users');
      
      const requiredFields = schema.fields.filter(f => f.isRequired);
      expect(requiredFields.length).toBeGreaterThan(0);

      // Campos que sabemos que son requeridos
      const emailField = schema.fields.find(f => f.name === 'email');
      expect(emailField?.isRequired).toBe(true);
    });

    it('debe extraer tipos de datos correctamente', () => {
      const schema = extractTableSchema(usersTable, 'users');

      const idField = schema.fields.find(f => f.name === 'id');
      const emailField = schema.fields.find(f => f.name === 'email');
      const createdAtField = schema.fields.find(f => f.name === 'createdAt');

      expect(idField?.type).toBe('number');
      expect(emailField?.type).toBe('string');
      expect(createdAtField?.type).toBe('date');
    });

    it('debe identificar claves primarias correctamente', () => {
      const schema = extractTableSchema(usersTable, 'users');

      expect(schema.primaryKeys).toBeDefined();
      expect(Array.isArray(schema.primaryKeys) || schema.primaryKeys === undefined).toBe(true);
      
      if (schema.primaryKeys) {
        expect(schema.primaryKeys).toContain('id');
      }
    });

    it('debe lanzar error si la tabla no está definida', () => {
      expect(() => {
        extractTableSchema(undefined, 'nonexistent');
      }).toThrow('Tabla no definida');
    });
  });

  describe('validateTableSchema', () => {
    it('debe validar un schema correcto sin lanzar error', () => {
      const schema = extractTableSchema(usersTable, 'users');

      expect(() => {
        validateTableSchema(schema);
      }).not.toThrow();
    });

    it('debe lanzar error si falta tableName', () => {
      const invalidSchema = {
        tableName: '',
        fields: [],
        primaryKeys: undefined
      };

      expect(() => {
        validateTableSchema(invalidSchema);
      }).toThrow('Schema debe tener tableName');
    });

    it('debe lanzar error si no hay campos', () => {
      const invalidSchema = {
        tableName: 'users',
        fields: [],
        primaryKeys: undefined
      };

      expect(() => {
        validateTableSchema(invalidSchema);
      }).toThrow('debe tener al menos un campo');
    });
  });

  describe('extractFieldInfo', () => {
    it('debe extraer información de un campo correctamente', () => {
      const schema = extractTableSchema(usersTable, 'users');
      const idField = schema.fields.find(f => f.name === 'id');

      expect(idField).toBeDefined();
      expect(idField?.name).toBe('id');
      expect(idField?.type).toBe('number');
      expect(idField?.isPrimaryKey).toBe(true);
    });

    it('debe incluir todas las propiedades esperadas en un campo', () => {
      const schema = extractTableSchema(usersTable, 'users');
      const field = schema.fields[0];

      expect(field).toHaveProperty('name');
      expect(field).toHaveProperty('type');
      expect(field).toHaveProperty('isRequired');
      expect(field).toHaveProperty('isUnique');
      expect(field).toHaveProperty('isPrimaryKey');
      expect(field).toHaveProperty('hasDefault');
    });
  });
});
