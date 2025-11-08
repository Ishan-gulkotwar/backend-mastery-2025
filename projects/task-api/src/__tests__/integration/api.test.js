const request = require('supertest');
const express = require('express');
const app = express();

// Setup app with routes
app.use(express.json());
const authRoutes = require('../../routes/auth');
const taskRoutes = require('../../routes/tasks');

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

describe('API Integration Tests', () => {
  let authToken;
  let userId;

  describe('Authentication Endpoints', () => {
    const testUser = {
      username: 'integrationtest',
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    };

    it('POST /api/auth/register - should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      
      authToken = response.body.token;
      userId = response.body.user.id;
    });

    it('POST /api/auth/register - should not register duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });

    it('POST /api/auth/login - should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('POST /api/auth/login - should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Task Endpoints', () => {
    it('GET /api/tasks - should require authentication', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('POST /api/tasks - should create a task with auth', async () => {
      const newTask = {
        title: 'Integration Test Task',
        description: 'Created by automated test',
        priority: 'high',
        status: 'pending'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTask)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('task');
      expect(response.body.task.title).toBe(newTask.title);
    });

    it('GET /api/tasks - should get all tasks for authenticated user', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(Array.isArray(response.body.tasks)).toBe(true);
    });
  });
});