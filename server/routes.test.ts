import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { router } from './routes';

// Mock Supabase
vi.mock('./db', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  data: [], error: null
                }))
              }))
            }))
          })),
          maybeSingle: vi.fn(() => ({ data: { role: 'user' }, error: null })),
        })),
        single: vi.fn(() => ({ data: {}, error: null })),
        limit: vi.fn(() => ({ data: [], error: null })), // for simple selects
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: { id: '1', name: 'test' }, error: null })),
          maybeSingle: vi.fn(() => ({ data: {}, error: null }))
        }))
      })),
      upsert: vi.fn(() => ({ error: null })),
      delete: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
      update: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })), in: vi.fn(() => ({ error: null })) })),
    }))
  }
}));

const app = express();
app.use(express.json());
app.use(router);

describe('API Routes', () => {
  describe('POST /api/names', () => {
    it('should create a name with valid data', async () => {
      const res = await request(app)
        .post('/api/names')
        .send({ name: 'ValidName' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for empty name', async () => {
      const res = await request(app)
        .post('/api/names')
        .send({ name: '' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for name too long', async () => {
      const res = await request(app)
        .post('/api/names')
        .send({ name: 'a'.repeat(51) });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid status', async () => {
        const res = await request(app)
          .post('/api/names')
          .send({ name: 'ValidName', status: 'invalid' });

        expect(res.status).toBe(400);
      });
  });

  describe('POST /api/users/create', () => {
     it('should create user with valid data', async () => {
       const res = await request(app)
         .post('/api/users/create')
         .send({ userName: 'validUser' });
       expect(res.status).toBe(200);
     });

     it('should return 400 for invalid username', async () => {
       const res = await request(app)
         .post('/api/users/create')
         .send({ userName: '' });
       expect(res.status).toBe(400);
     });
  });
});
