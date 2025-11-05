const express = require('express');
const redis = require('redis');

const app = express();
const PORT = 3000;

// Create Redis client
const redisClient = redis.createClient({
  socket: {
    host: 'localhost',
    port: 6379
  }
});

// Connect to Redis
redisClient.connect().catch(console.error);

// Handle Redis connection events
redisClient.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

// Middleware
app.use(express.json());

// Simulated database (in real app, this would be PostgreSQL/MongoDB)
const fakeDatabase = {
  '1': { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Developer' },
  '2': { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Designer' },
  '3': { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager' }
};

// Simulate slow database query
const fetchFromDatabase = (userId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(fakeDatabase[userId] || null);
    }, 2000); // 2 second delay to simulate slow DB
  });
};

// Route 1: Get user WITHOUT cache (slow)
app.get('/user-nocache/:id', async (req, res) => {
  const userId = req.params.id;
  const startTime = Date.now();

  try {
    const user = await fetchFromDatabase(userId);
    const responseTime = Date.now() - startTime;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      source: 'database',
      responseTime: `${responseTime}ms`,
      data: user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route 2: Get user WITH cache (fast!)
app.get('/user/:id', async (req, res) => {
  const userId = req.params.id;
  const cacheKey = `user:${userId}`;
  const startTime = Date.now();

  try {
    // Step 1: Check Redis cache first
    const cachedUser = await redisClient.get(cacheKey);
    
    if (cachedUser) {
      const responseTime = Date.now() - startTime;
      return res.json({
        source: 'cache (Redis)',
        responseTime: `${responseTime}ms`,
        data: JSON.parse(cachedUser),
        message: '⚡ Lightning fast!'
      });
    }

    // Step 2: Cache miss - fetch from database
    const user = await fetchFromDatabase(userId);
    const responseTime = Date.now() - startTime;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Step 3: Store in Redis cache (expires in 1 hour)
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(user));

    res.json({
      source: 'database (cached for next time)',
      responseTime: `${responseTime}ms`,
      data: user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route 3: Clear specific user from cache
app.delete('/cache/user/:id', async (req, res) => {
  const userId = req.params.id;
  const cacheKey = `user:${userId}`;

  try {
    await redisClient.del(cacheKey);
    res.json({ message: `Cache cleared for user ${userId}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route 4: Clear all cache
app.delete('/cache/all', async (req, res) => {
  try {
    await redisClient.flushAll();
    res.json({ message: 'All cache cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route 5: Get cache stats
app.get('/cache/stats', async (req, res) => {
  try {
    const keys = await redisClient.keys('*');
    res.json({
      totalCachedItems: keys.length,
      cachedKeys: keys
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('\n📝 Try these endpoints:');
  console.log(`   GET  http://localhost:${PORT}/user-nocache/1  (slow - no cache)`);
  console.log(`   GET  http://localhost:${PORT}/user/1          (fast - with cache)`);
  console.log(`   GET  http://localhost:${PORT}/cache/stats     (see cached items)`);
  console.log(`   DEL  http://localhost:${PORT}/cache/user/1    (clear specific user)`);
  console.log(`   DEL  http://localhost:${PORT}/cache/all       (clear all cache)`);
});