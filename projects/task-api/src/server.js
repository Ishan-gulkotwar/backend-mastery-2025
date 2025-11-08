const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 4000;
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
console.log('📚 Swagger spec loaded:', Object.keys(swaggerSpec).length > 0 ? 'YES' : 'NO');
console.log('📚 Swagger spec keys:', Object.keys(swaggerSpec));

// Middleware
app.use(cors());
app.use(express.json());

// Swagger Documentation
const swaggerSetup = swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Task API Documentation'
});

app.use('/api-docs', swaggerUi.serve, (req, res, next) => {
  swaggerSetup(req, res, next);
});

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(rateLimiter(100, 60)); // 100 requests per minute

// API Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Task Management API',
    version: '1.0.0',
    description: 'RESTful API for task management',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      tasks: '/api/tasks',
      health: '/health'
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Task API running on http://localhost:${PORT}`);
  console.log('\n📝 Available endpoints:');
  console.log('   POST   /api/auth/register    - Register new user');
  console.log('   POST   /api/auth/login       - Login user');
  console.log('   GET    /api/tasks            - Get all tasks');
  console.log('   POST   /api/tasks            - Create task');
  console.log('   GET    /api/tasks/:id        - Get single task');
  console.log('   PUT    /api/tasks/:id        - Update task');
  console.log('   DELETE /api/tasks/:id        - Delete task');
  console.log('   GET    /health               - Health check');
  console.log('\n📚 API Documentation: http://localhost:' + PORT + '/api-docs');
  console.log('📊 API Info: http://localhost:' + PORT + '/api/info\n');
});