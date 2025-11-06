const express = require('express');
const redis = require('redis');

const app = express();
const PORT = 3002;

const redisClient = redis.createClient({
  socket: { host: 'localhost', port: 6379 }
});

redisClient.connect().catch(console.error);

redisClient.on('connect', () => {
  console.log(' Connected to Redis');
});

// ==================== STRATEGY 1: FIXED WINDOW ====================
/**
 * Simple fixed window counter
 * Pros: Simple, efficient
 * Cons: Burst at window boundaries
 */
async function fixedWindowLimiter(identifier, limit, windowSeconds) {
  const key = `fixed:${identifier}`;
  
  const current = await redisClient.get(key);
  
  if (!current) {
    await redisClient.setEx(key, windowSeconds, '1');
    return { allowed: true, remaining: limit - 1 };
  }
  
  const count = parseInt(current);
  
  if (count >= limit) {
    const ttl = await redisClient.ttl(key);
    return { allowed: false, remaining: 0, retryAfter: ttl };
  }
  
  await redisClient.incr(key);
  return { allowed: true, remaining: limit - count - 1 };
}

// ==================== STRATEGY 2: SLIDING WINDOW LOG ====================
/**
 * Sliding window using sorted sets
 * Pros: Accurate, no burst issues
 * Cons: More memory (stores each request)
 */
async function slidingWindowLimiter(identifier, limit, windowSeconds) {
  const key = `sliding:${identifier}`;
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);
  
  // Remove old requests outside window
  await redisClient.zRemRangeByScore(key, 0, windowStart);
  
  // Count requests in current window
  const count = await redisClient.zCard(key);
  
  if (count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  // Add current request
  await redisClient.zAdd(key, { score: now, value: `${now}` });
  
  // Set expiration
  await redisClient.expire(key, windowSeconds);
  
  return { allowed: true, remaining: limit - count - 1 };
}

// ==================== STRATEGY 3: TOKEN BUCKET ====================
/**
 * Token bucket algorithm
 * Pros: Handles bursts gracefully
 * Cons: More complex logic
 */
async function tokenBucketLimiter(identifier, capacity, refillRate, refillTime) {
  const key = `bucket:${identifier}`;
  
  const data = await redisClient.get(key);
  
  let tokens, lastRefill;
  
  if (!data) {
    tokens = capacity;
    lastRefill = Date.now();
  } else {
    const parsed = JSON.parse(data);
    tokens = parsed.tokens;
    lastRefill = parsed.lastRefill;
    
    // Refill tokens based on time passed
    const now = Date.now();
    const timePassed = now - lastRefill;
    const tokensToAdd = Math.floor(timePassed / refillTime) * refillRate;
    
    tokens = Math.min(capacity, tokens + tokensToAdd);
    lastRefill = now;
  }
  
  if (tokens < 1) {
    await redisClient.setEx(key, 60, JSON.stringify({ tokens, lastRefill }));
    return { allowed: false, remaining: 0 };
  }
  
  tokens -= 1;
  await redisClient.setEx(key, 60, JSON.stringify({ tokens, lastRefill }));
  
  return { allowed: true, remaining: tokens };
}

// ==================== ROUTES ====================

// Fixed Window Rate Limiter
app.get('/fixed', async (req, res) => {
  const result = await fixedWindowLimiter(req.ip, 5, 60);
  
  res.set({
    'X-RateLimit-Limit': 5,
    'X-RateLimit-Remaining': result.remaining,
    'X-RateLimit-Strategy': 'Fixed Window'
  });
  
  if (!result.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      strategy: 'Fixed Window',
      retryAfter: result.retryAfter
    });
  }
  
  res.json({ 
    message: 'Success!', 
    strategy: 'Fixed Window',
    remaining: result.remaining 
  });
});

// Sliding Window Rate Limiter
app.get('/sliding', async (req, res) => {
  const result = await slidingWindowLimiter(req.ip, 5, 60);
  
  res.set({
    'X-RateLimit-Limit': 5,
    'X-RateLimit-Remaining': result.remaining,
    'X-RateLimit-Strategy': 'Sliding Window'
  });
  
  if (!result.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      strategy: 'Sliding Window'
    });
  }
  
  res.json({ 
    message: 'Success!', 
    strategy: 'Sliding Window',
    remaining: result.remaining 
  });
});

// Token Bucket Rate Limiter
app.get('/bucket', async (req, res) => {
  // 10 tokens capacity, refill 2 tokens every 10 seconds
  const result = await tokenBucketLimiter(req.ip, 10, 2, 10000);
  
  res.set({
    'X-RateLimit-Limit': 10,
    'X-RateLimit-Remaining': result.remaining,
    'X-RateLimit-Strategy': 'Token Bucket'
  });
  
  if (!result.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      strategy: 'Token Bucket'
    });
  }
  
  res.json({ 
    message: 'Success!', 
    strategy: 'Token Bucket',
    remaining: result.remaining 
  });
});

// Compare all strategies
app.get('/compare', async (req, res) => {
  const fixed = await fixedWindowLimiter(`${req.ip}:compare:fixed`, 5, 60);
  const sliding = await slidingWindowLimiter(`${req.ip}:compare:sliding`, 5, 60);
  const bucket = await tokenBucketLimiter(`${req.ip}:compare:bucket`, 10, 2, 10000);
  
  res.json({
    strategies: {
      fixedWindow: {
        allowed: fixed.allowed,
        remaining: fixed.remaining,
        description: 'Simple counter, resets at fixed intervals'
      },
      slidingWindow: {
        allowed: sliding.allowed,
        remaining: sliding.remaining,
        description: 'Accurate window, prevents burst at boundaries'
      },
      tokenBucket: {
        allowed: bucket.allowed,
        remaining: bucket.remaining,
        description: 'Handles bursts gracefully with token refill'
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(` Advanced Rate Limiter running on http://localhost:${PORT}`);
  console.log('\n Test different strategies:');
  console.log('   Fixed Window:   curl http://localhost:3002/fixed');
  console.log('   Sliding Window: curl http://localhost:3002/sliding');
  console.log('   Token Bucket:   curl http://localhost:3002/bucket');
  console.log('   Compare All:    curl http://localhost:3002/compare\n');
});