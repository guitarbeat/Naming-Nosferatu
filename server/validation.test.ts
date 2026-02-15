import { describe, it, expect } from 'vitest';
import { createNameSchema, createUserSchema } from './validation';

describe('Validation Schemas', () => {
  describe('createNameSchema', () => {
    it('should validate valid name', () => {
      const valid = { name: 'Valid Name', description: 'Some description', status: 'candidate' };
      const result = createNameSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalid = { name: '' };
      const result = createNameSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject long name', () => {
      const invalid = { name: 'a'.repeat(51) };
      const result = createNameSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const invalid = { name: 'Valid', status: 'invalid' };
      const result = createNameSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('createUserSchema', () => {
    it('should validate valid user', () => {
      const valid = { userName: 'validUser' };
      const result = createUserSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject empty userName', () => {
      const invalid = { userName: '' };
      const result = createUserSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject long userName', () => {
      const invalid = { userName: 'a'.repeat(51) };
      const result = createUserSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
