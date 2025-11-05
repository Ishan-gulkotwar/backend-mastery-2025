# Simple Cache Server with Redis

Demonstrating Redis caching to improve API performance by 670x.

##  What I Learned
- Redis setup with Docker
- Basic Redis commands: `GET`, `SET`, `SETEX`, `DEL`, `KEYS`
- Cache-aside caching pattern
- **Performance improvement: 2010ms → 3ms (670x faster!)**

##  How to Run

### Prerequisites
```bash
# Start Redis with Docker
docker run -d -p 6379:6379 redis:latest
```

### Install & Run
```bash
npm install
node server.js
```

##  Test the Performance Difference

### Without Cache (Slow)
```bash
curl http://localhost:3000/user-nocache/1
# Response time: ~2000ms
```

### With Cache (Fast!)
```bash
# First call - builds cache
curl http://localhost:3000/user/1
# Response time: ~2000ms

# Second call - from Redis
curl http://localhost:3000/user/1
# Response time: ~3ms 
```

### Other Endpoints
```bash
# View cache statistics
curl http://localhost:3000/cache/stats

# Clear specific user cache
curl -X DELETE http://localhost:3000/cache/user/1

# Clear all cache
curl -X DELETE http://localhost:3000/cache/all
```

##  Key Concepts

### Cache-Aside Pattern
1. Check cache first
2. If cache miss → fetch from database
3. Store result in cache with TTL (Time To Live)
4. Return response

### When to Use Redis Caching
✅ Frequently accessed data  
✅ Expensive database queries  
✅ User sessions  
✅ API rate limiting  
✅ Real-time leaderboards  

##  Real Results
- **Database query:** 2010ms
- **Redis cache:** 3ms
- **Improvement:** 670x faster
- **Cache expiry:** 1 hour (3600 seconds)

##  Next Steps
- [ ] Learn Redis data structures (Lists, Sets, Sorted Sets, Hashes)
- [ ] Build rate limiter with Redis
- [ ] Implement Redis Pub/Sub for real-time features
- [ ] Add Redis to production application