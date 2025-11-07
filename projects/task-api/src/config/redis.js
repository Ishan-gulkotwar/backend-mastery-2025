const redis = require('redis');
require('dotenv').config();

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

redisClient.connect().catch(console.error);

redisClient.on('connect', () => {
  console.log(' Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error(' Redis error:', err);
});

module.exports = redisClient;