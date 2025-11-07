const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimiter(100, 60)); // 100 requests per minute

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
  console.log('   GET    /health               - Health check\n');
});