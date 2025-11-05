### Day 1 - November 5, 2025 ✅
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

#### Real Performance Results
- Database query: 2010ms
- Redis cache hit: 3ms
- **670x performance improvement!** 🚀

#### System Design Practice
- ✅ URL Shortener design (45 min)
- Designed API endpoints
- Planned database schema
- Drew architecture diagram
- Figured out Base62 encoding approach
- Connected Redis learning to real system design

#### Key Insights
- Read-heavy systems NEED caching
- Redis is insanely fast for simple lookups
- Base62 encoding avoids collision problems
- Always think about scaling from the start
- Cache-aside pattern works great for read-heavy apps

#### Time Spent
- 3.5 hours total
- Redis learning: 2 hours
- System design: 1.5 hours

#### Tomorrow's Plan
- Deep dive Redis data structures (Lists, Sets, Sorted Sets, Hashes)
- Build rate limiter with Redis
- LeetCode: Two Sum, LRU Cache
- Maybe another system design (Twitter feed or Instagram)

#### Notes to Self
- Redis is way easier than I thought
- System design is fun when you connect it to real code
- Need to practice more capacity estimation math
- Should actually implement the URL shortener this week