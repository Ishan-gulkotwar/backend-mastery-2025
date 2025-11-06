const express = require('express');
const redis = require('redis');

const app = express();
app.use(express.json());
const PORT = 3004;

const redisClient = redis.createClient({
  socket: { host: 'localhost', port: 6379 }
});

redisClient.connect().catch(console.error);

redisClient.on('connect', () => console.log('✅ Redis connected'));

// ==================== REDIS LISTS - TASK QUEUE ====================

/**
 * Add task to queue
 * LPUSH - Add to left (head) of list
 */
app.post('/task', async (req, res) => {
  const { type, data } = req.body;
  
  const task = {
    id: Date.now().toString(),
    type,
    data,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  try {
    // LPUSH adds to front of queue
    await redisClient.lPush('task_queue', JSON.stringify(task));
    const queueLength = await redisClient.lLen('task_queue');
    
    res.json({
      message: 'Task queued',
      task,
      queueLength
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Process next task (worker simulation)
 * RPOP - Remove from right (tail) of list = FIFO queue
 */
app.post('/process', async (req, res) => {
  try {
    // RPOP removes from end (oldest task first)
    const taskStr = await redisClient.rPop('task_queue');
    
    if (!taskStr) {
      return res.json({ message: 'Queue empty' });
    }
    
    const task = JSON.parse(taskStr);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    
    // Store in completed hash
    await redisClient.hSet('completed_tasks', task.id, JSON.stringify(task));
    
    res.json({
      message: 'Task processed',
      task,
      remainingTasks: await redisClient.lLen('task_queue')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * View queue
 * LRANGE - Get all items without removing
 */
app.get('/queue', async (req, res) => {
  try {
    const tasks = await redisClient.lRange('task_queue', 0, -1);
    
    res.json({
      queueLength: tasks.length,
      tasks: tasks.map(t => JSON.parse(t))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== REDIS HASHES - USER PROFILES ====================

/**
 * Create/Update user profile
 * HSET - Set field in hash
 */
app.post('/user/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, role, status } = req.body;
  
  try {
    // HSET stores multiple fields
    await redisClient.hSet(`user:${id}`, {
      name: name || '',
      email: email || '',
      role: role || 'user',
      status: status || 'active',
      updatedAt: new Date().toISOString()
    });
    
    res.json({
      message: 'User saved',
      userId: id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user profile
 * HGETALL - Get all fields from hash
 */
app.get('/user/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const user = await redisClient.hGetAll(`user:${id}`);
    
    if (Object.keys(user).length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      userId: id,
      profile: user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update single field
 * HSET - Update one field
 */
app.patch('/user/:id/:field', async (req, res) => {
  const { id, field } = req.params;
  const { value } = req.body;
  
  try {
    await redisClient.hSet(`user:${id}`, field, value);
    await redisClient.hSet(`user:${id}`, 'updatedAt', new Date().toISOString());
    
    res.json({
      message: `${field} updated`,
      userId: id,
      [field]: value
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get specific field
 * HGET - Get one field
 */
app.get('/user/:id/:field', async (req, res) => {
  const { id, field } = req.params;
  
  try {
    const value = await redisClient.hGet(`user:${id}`, field);
    
    if (!value) {
      return res.status(404).json({ error: 'Field not found' });
    }
    
    res.json({
      userId: id,
      field,
      value
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get completed tasks
 * HGETALL - Get all completed tasks
 */
app.get('/completed', async (req, res) => {
  try {
    const tasks = await redisClient.hGetAll('completed_tasks');
    
    res.json({
      count: Object.keys(tasks).length,
      tasks: Object.values(tasks).map(t => JSON.parse(t))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Clear all data
 */
app.delete('/clear', async (req, res) => {
  try {
    await redisClient.del('task_queue');
    await redisClient.del('completed_tasks');
    
    res.json({ message: 'All data cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Task Queue API on http://localhost:${PORT}`);
  console.log('\n📋 REDIS LISTS - Task Queue:');
  console.log('  POST /task         - Add task to queue');
  console.log('  POST /process      - Process next task');
  console.log('  GET  /queue        - View queue');
  console.log('\n👤 REDIS HASHES - User Profiles:');
  console.log('  POST  /user/:id          - Create/update user');
  console.log('  GET   /user/:id          - Get user profile');
  console.log('  PATCH /user/:id/:field   - Update single field');
  console.log('  GET   /user/:id/:field   - Get single field\n');
});