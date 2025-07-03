const request = require('supertest');
const app = require('../index'); // Ensure your app is exported in index.js

describe('Auth Routes', () => {
  it('should sign up a new user', async () => {
    const res = await request(app).post('/auth/signup').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });
});