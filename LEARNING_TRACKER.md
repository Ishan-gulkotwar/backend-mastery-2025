
**Focus:** Redis Basics + System Design

#### What I Learned
- ✅ Redis setup with Docker
- ✅ Basic Redis commands (GET, SET, SETEX, DEL, KEYS, FLUSHALL)
- ✅ Cache-aside caching pattern
- ✅ Performance impact: 2010ms → 3ms (670x faster!)
- ✅ System design methodology
- ✅ Capacity estimation techniques
- ✅ Base62 encoding for URL shorteners

#### What I Built
- ✅ Redis cache server with Express
- ✅ Comparison endpoints (cached vs non-cached)
- ✅ Cache management endpoints
- ✅ Complete URL shortener system design

#### System Design Practice
- ✅ URL Shortener design
- Designed API endpoints
- Planned database schema
- Drew architecture diagram
- Figured out Base62 encoding approach
- Connected Redis learning to real system design

#### Real Performance Results
- Database query: 2010ms
- Redis cache hit: 3ms
- **670x performance improvement!** 🚀

#### Key Insights
- Read-heavy systems NEED caching
- Redis is insanely fast for simple lookups
- Base62 encoding avoids collision problems
- Always think about scaling from the start
- Cache-aside pattern works great for read-heavy apps

#### Evening Bonus Session
- ✅ Built production-ready rate limiter
- ✅ Implemented 3 strategies (Fixed Window, Sliding Window, Token Bucket)
- ✅ Successfully tested - blocked 6th request with 429 error
- ✅ Learned Redis sorted sets and atomic operation

####  Final Stats
**Projects:** 3 (Cache server, URL shortener design, Rate limiter)  
**Lines of Code:** ~500  
**Performance Gains:** 670x with caching  
**Skills Added:** Redis, System Design, Rate Limiting, Docker


#### Redis Data Structures
- ✅ Learned Redis Sorted Sets (ZSET)
- ✅ Built real-time leaderboard system
- ✅ Implemented 8 different leaderboard operations
- ✅ Tested with 11 players - achieved #1 rank! 👑
- ✅ Understood O(log N) time complexity

#### Redis Commands Mastered Today
**Strings:** GET, SET, SETEX, DEL, INCR, TTL  
**Sorted Sets:** ZADD, ZINCRBY, ZREVRANK, ZREVRANGE, ZSCORE, ZCARD, ZREM

#### Day 1 Final Count
- **Projects:** 4 (Cache, Rate Limiter, URL Shortener Design, Leaderboard)
- **Lines of Code:** ~800
- **Time:** 6+ hours
- **Redis Commands:** 15+