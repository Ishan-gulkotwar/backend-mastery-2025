### Day 1 - November 5, 2025 ✅
**Focus:** Redis Basics + Caching Performance

#### What I Learned
- ✅ Redis setup with Docker
- ✅ Basic Redis commands (GET, SET, SETEX, DEL, KEYS, FLUSHALL)
- ✅ Cache-aside caching pattern
- ✅ Performance impact: 2010ms → 3ms (670x faster!)

#### What I Built
- ✅ Simple cache server with Express + Redis
- ✅ Endpoints: cached vs non-cached comparison
- ✅ Cache statistics and management endpoints

#### Key Takeaways
- Redis delivers single-digit millisecond response times
- Caching reduces database load by 670x
- Always set TTL (expiration) to avoid stale data
- Cache-aside pattern: check cache → DB on miss → store in cache

#### Real Performance Results
- Database query: 2010ms
- Redis cache hit: 3ms
- Performance improvement: 670x faster! 🚀

#### Time Spent
- 3 hours on setup, Redis learning, and implementation

#### Tomorrow's Plan
- Deep dive into Redis data structures (Lists, Sets, Hashes)
- Build rate limiter using Redis
- System Design: Design URL Shortener