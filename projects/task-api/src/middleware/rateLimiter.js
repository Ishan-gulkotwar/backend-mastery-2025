const redisClient = require('../config/redis');

const rateLimiter = (limit = 100, windowSeconds = 60) => {
  return async (req, res, next) => {
    const ip = req.ip;
    const key = `rate_limit:${ip}`;
    
    try {
      const current = await redisClient.get(key);
      
      if (!current) {
        await redisClient.setEx(key, windowSeconds, '1');
        return next();
      }
      
      const count = parseInt(current);
      
      if (count >= limit) {
        const ttl = await redisClient.ttl(key);
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: ttl
        });
      }
      
      await redisClient.incr(key);
      next();
    } catch (error) {
      // Fail open - allow request if Redis is down
      next();
    }
  };
};

module.exports = rateLimiter;