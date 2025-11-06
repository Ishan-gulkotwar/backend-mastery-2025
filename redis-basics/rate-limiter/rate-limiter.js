const express = require('express');
const redis = require('redis');

const app = express();
const PORT = 3001;

// Create Redis client
const redisClient = redis.createClient({
  socket: {
    host: 'localhost',
    port: 6379
  }
});

redisClient.connect().catch(console.error);

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis');
});

// Rate limiter configuration
const RATE_LIMIT = 5;        // Maximum requests
const WINDOW_SIZE = 60;      // Time window in seconds (1 minute)

/**
 * Rate Limiter Middleware
 * Limits each IP to RATE_LIMIT requests per WINDOW_SIZE seconds
 */
async function rateLimiter(req, res, next) {
  // Use IP address as identifier (in production, use user ID)
  const identifier = req.ip;
  const key = `rate_limit:${identifier}`;

  try {
    // Get current request count
    const currentCount = await redisClient.get(key);

    if (currentCount === null) {
      // First request - set count to 1 with expiration
      await redisClient.setEx(key, WINDOW_SIZE, '1');
      
      res.set({
        'X-RateLimit-Limit': RATE_LIMIT,
        'X-RateLimit-Remaining': RATE_LIMIT - 1,
        'X-RateLimit-Reset': Date.now() + (WINDOW_SIZE * 1000)
      });
      
      return next();
    }

    const count = parseInt(currentCount);

    if (count < RATE_LIMIT) {
      // Under limit - increment count
      await redisClient.incr(key);
      
      res.set({
        'X-RateLimit-Limit': RATE_LIMIT,
        'X-RateLimit-Remaining': RATE_LIMIT - count - 1,
        'X-RateLimit-Reset': Date.now() + (WINDOW_SIZE * 1000)
      });
      
      return next();
    }

    // Over limit - reject request
    const ttl = await redisClient.ttl(key);
    
    res.set({
      'X-RateLimit-Limit': RATE_LIMIT,
      'X-RateLimit-Remaining': 0,
      'X-RateLimit-Reset': Date.now() + (ttl * 1000),
      'Retry-After': ttl
    });

    return res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${ttl} seconds.`,
      limit: RATE_LIMIT,
      windowSize: `${WINDOW_SIZE} seconds`
    });

  } catch (error) {
    console.error('Rate limiter error:', error);
    // On error, allow request (fail open)
    return next();
  }
}

// Apply rate limiter to all routes
app.use(rateLimiter);

// Test endpoint
app.get('/api/data', (req, res) => {
  res.json({
    message: 'Success! You are within rate limits.',
    data: {
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(7)
    }
  });
});

// Health check (no rate limit)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Rate Limiter API running on http://localhost:${PORT}`);
  console.log(`⚙️  Rate Limit: ${RATE_LIMIT} requests per ${WINDOW_SIZE} seconds`);
  console.log('\n📝 Try this:');
  console.log(`   Run this command 6 times quickly:`);
  console.log(`   curl http://localhost:${PORT}/api/data\n`);
});