# System Design: Twitter/Instagram Feed
---
## 1. Problem Statement

Design a system that shows users their personalized feed/timeline.

**Example:** When you open Twitter, you see tweets from people you follow, sorted by time or relevance.

---

## 2. Requirements

### Functional Requirements
- Users can post tweets/updates
- Users can follow other users
- Users see a feed of posts from people they follow
- Feed should show recent posts first
- Posts include text, images, metadata

### Non-Functional Requirements
- Low latency (<200ms to load feed)
- Highly available (99.9% uptime)
- Eventually consistent (okay if feed is slightly delayed)
- Scale to millions of users

---

## 3. Capacity Estimation

**YOUR TURN:** Calculate these numbers:

### Assumptions
- 300M active users
- Each user follows 200 people on average
- Each user posts 2 tweets per day
- Each user loads their feed 10 times per day

### Calculations

**Daily Posts:**
```
300M users × 2 posts/day = 600M posts/day
= 600M / 86400 seconds ≈ 7000 writes/second
```

**Daily Feed Loads:**
```
300M users × 10 loads/day = 3 billion feed loads/day
= 3B / 86400 ≈ 35,000 reads/second
```

**Read:Write Ratio:**
```
35,000 reads : 7,000 writes = 5:1 (read-heavy!)
```

**Storage per post:** ~1KB (text, metadata, image URL)
**Storage needed (5 years):**
```
600M posts/day × 365 × 5 years = 1.1 trillion posts
1.1T × 1KB = 1.1 PB (petabytes)
```

---

## 4. API Design

### Post a Tweet
```
POST /api/tweet
Body: {
  "userId": "123",
  "content": "Hello world!",
  "media": ["image_url"]
}

Response: {
  "tweetId": "xyz789",
  "timestamp": "2025-11-06T10:30:00Z"
}
```

### Get User Feed
```
GET /api/feed?userId=123&limit=20&cursor=abc

Response: {
  "tweets": [...],
  "nextCursor": "def456",
  "hasMore": true
}
```

### Follow User
```
POST /api/follow
Body: {
  "followerId": "123",
  "followeeId": "456"
}
```

---

## 5. Database Design

### Tables Needed

**Users Table:**
```sql
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    created_at TIMESTAMP
);
```

**Tweets Table:**
```sql
CREATE TABLE tweets (
    tweet_id BIGINT PRIMARY KEY,
    user_id BIGINT,
    content TEXT,
    media_urls TEXT[],
    created_at TIMESTAMP,
    INDEX(user_id, created_at)
);
```

**Follows Table:**
```sql
CREATE TABLE follows (
    follower_id BIGINT,
    followee_id BIGINT,
    created_at TIMESTAMP,
    PRIMARY KEY(follower_id, followee_id),
    INDEX(follower_id),
    INDEX(followee_id)
);
```

---

## 6. The Big Problem: Feed Generation

**Challenge:** User follows 200 people. How do we generate their feed?

### Approach 1: Pull Model (Fetch on Demand) 

**How it works:**
1. User requests feed
2. Query: "Get tweets from all people I follow"
3. Sort by timestamp
4. Return top 20

**SQL:**
```sql
SELECT tweets.* 
FROM tweets
WHERE user_id IN (
  SELECT followee_id FROM follows WHERE follower_id = 123
)
ORDER BY created_at DESC
LIMIT 20;
```

**Problems:**
- Slow! Need to check 200 users' tweets
- Database gets hammered with complex queries
- 35,000 reads/second = database dies

**When to use:** Small scale, few followers

---

### Approach 2: Push Model (Fan-out on Write) 

**How it works:**
1. User posts tweet
2. System pushes tweet to ALL followers' pre-built feeds
3. User requests feed → just read from their pre-built feed
4. Fast reads!

**Flow:**
```
1. @elonmusk posts tweet
2. He has 150M followers
3. System adds tweet to 150M users' feeds (async)
4. When you load feed → instant! Already built!
```

**Implementation using Redis:**
```
User feed stored as Redis List:
feed:user:123 = [tweet_id_5, tweet_id_4, tweet_id_3, ...]
```

**Pros:**
- Super fast reads (just LRANGE)
- Feed already computed
- Works well for read-heavy systems

**Cons:**
- Expensive writes for celebrities (fan-out to millions!)
- Storage overhead (duplicate feeds)

---

### Approach 3: Hybrid (Best!) 

**Smart combination:**

**For regular users (<10K followers):**
- Use Push Model (fan-out on write)
- Pre-build their followers' feeds

**For celebrities (>10K followers):**
- Use Pull Model (fetch on demand)
- Don't fan-out to millions

**When user loads feed:**
1. Get pre-built feed from Redis (Push)
2. Merge in tweets from celebrities they follow (Pull)
3. Sort and return

**This is what Twitter actually uses!**

---

## 7. High-Level Architecture
```
┌─────────────┐
│   Client    │ (Mobile/Web)
└──────┬──────┘
       │
       ▼
┌──────────────┐
│Load Balancer │
└──────┬───────┘
       │
   ┌───┴────┐
   ▼        ▼
┌────────┐ ┌────────┐
│  API   │ │  API   │  (Stateless)
│ Server │ │ Server │
└───┬────┘ └───┬────┘
    │          │
    └────┬─────┘
         │
    ┌────┴──────────┐
    ▼               ▼
┌─────────┐    ┌──────────┐
│  Redis  │    │PostgreSQL│
│  Cache  │    │ Database │
│ (Feeds) │    │ (Tweets) │
└─────────┘    └──────────┘
    │               │
    └───────┬───────┘
            ▼
    ┌──────────────┐
    │ Message Queue│  (Kafka/RabbitMQ)
    │ (Fan-out)    │
    └──────────────┘
```

---

## 8. Detailed Component Design

### Redis Usage (Multiple data structures!)

**1. User Feeds (Lists):**
```
feed:user:123 = [tweet789, tweet788, tweet787, ...]
LRANGE feed:user:123 0 19  # Get top 20 tweets
```

**2. Tweet Cache (Hashes):**
```
tweet:789 = {user_id: "456", content: "Hello!", timestamp: "..."}
HGETALL tweet:789
```

**3. Follower Count (Strings):**
```
followers:count:123 = "1500"
INCR followers:count:123
```

**4. Trending Topics (Sorted Sets):**
```
trending = {("AI": 5000), ("Python": 3500), ...}
ZINCRBY trending 1 "AI"
```

---

## 9. Feed Generation Workflow

### When User Posts Tweet:
```
1. Store tweet in database
   INSERT INTO tweets VALUES (...)

2. Add to user's own timeline
   LPUSH feed:user:123 tweet_id

3. Get all followers
   SELECT follower_id FROM follows WHERE followee_id = 123

4. If followers < 10K:
   For each follower:
     LPUSH feed:user:{follower_id} tweet_id
     (Do this async via message queue!)

5. If followers > 10K:
   Skip fan-out (celebrity optimization)
```

### When User Loads Feed:
```
1. Check Redis cache
   tweets = LRANGE feed:user:123 0 19

2. If user follows celebrities:
   celebrity_tweets = SELECT FROM tweets WHERE...
   Merge with cached feed

3. Fetch full tweet details
   For each tweet_id:
     HGETALL tweet:{id}

4. Return to user
```

---

## 10. Scaling Strategies

### Database Sharding
- Shard tweets by user_id
- Shard 1: Users 1-100M
- Shard 2: Users 100M-200M

### Redis Clustering
- Multiple Redis nodes
- Consistent hashing for feed distribution

### CDN for Media
- Images/videos served from CDN
- Not from database

### Async Processing
- Message queue (Kafka) for fan-out
- Workers process fan-out in background
- User doesn't wait for fan-out to complete

---

## 11. How Redis Powers This (Based on What You Built!)

**From your Cache Server (Day 1):**
- Cache tweet details for fast retrieval
- Avoid database hits for popular tweets

**From your Leaderboard (Day 2):**
- Trending topics using Sorted Sets
- Most liked tweets ranking

**From your Task Queue (Day 2):**
- Fan-out jobs queued using Lists
- Workers process feed updates

**From your Pub/Sub (Day 2):**
- Real-time notifications
- "New tweet from @user!"

---

## 12. Interview Follow-up Questions

**Q: What if a celebrity with 100M followers tweets?**
**A:**
```
- Don't fan-out to 100M feeds (too expensive)
- Mark as celebrity in database
- Fetch their tweets on-demand when users load feed
- Cache their recent tweets heavily
```

**Q: How to handle tweet deletions?**
**A:**
```
- Mark as deleted in database (soft delete)
- Remove from cached feeds asynchronously
- Eventually consistent - some users might see it briefly
```

**Q: How do you rank tweets (not just by time)?**
**A:**
```
- Use ML model to score tweets
- Factors: likes, retweets, engagement, user interests
- Pre-compute scores, store in Sorted Set
- Fetch top-scored tweets for personalized feed
```

**Q: What if Redis goes down?**
**A:**
```
- Fallback to database (slower but works)
- Redis replication (master-slave)
- Feed regeneration on cache miss
```

---

## 13. Summary

### Key Decisions
1.  Hybrid approach (Push + Pull)
2.  Redis Lists for pre-built feeds
3.  Async fan-out using message queue
4.  Celebrity optimization (no fan-out)
5.  PostgreSQL for persistent storage

### Technologies
- **API:** Node.js/Express
- **Cache:** Redis (Lists, Hashes, Sorted Sets)
- **Database:** PostgreSQL (sharded)
- **Queue:** Kafka/RabbitMQ
- **CDN:** CloudFront/Cloudflare

### Performance Targets
- Feed load: <200ms
- Post tweet: <100ms (async fan-out)
- Availability: 99.9%
- Scale: 300M users

---

## What I Learned

- Fan-out on write vs pull on demand trade-offs
- Hybrid approach for different user tiers
- Redis is perfect for feed storage (Lists!)
- All 5 Redis data structures used in one system!
- Message queues for async processing
- Celebrity problem and optimization

**This design uses EVERYTHING I built in Days 1-2:**
- Caching (Day 1)
- Sorted Sets for trending (Day 2)
- Lists for feeds (Day 2)
- Pub/Sub for notifications (Day 2)

