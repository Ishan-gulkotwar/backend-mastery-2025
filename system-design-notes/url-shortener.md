# System Design: URL Shortener (like bit.ly)

**Date:** November 5, 2025  
**Time Spent:** ~45 minutes (took longer than expected but worth it!)

---

## 1. Requirements Gathering

### Functional Requirements
- Shorten long URLs to short URLs
- Redirect short URL to original URL
- Track basic click counts
- Optional: custom aliases, expiration dates

### Non-Functional Requirements
- Low latency - redirects should be fast (<100ms)
- Handle millions of URLs
- High availability - can't go down
- Short URLs should be actually short (6-7 chars)

### Not worrying about for now
- User accounts/auth
- Detailed analytics dashboards
- Editing URLs after creation

---

## 2. Back-of-envelope calculations

Let's say we get 100M new URLs per month. That's roughly:
- 100M / 30 days / 24 hours / 3600 sec ≈ **40 writes/sec**

For reads, URL shorteners are heavily read-heavy. Let's say 100:1 ratio:
- 100M writes × 100 = 10B reads/month
- 10B / 30 / 24 / 3600 ≈ **4000 reads/sec**

Storage over 5 years:
- 100M URLs/month × 60 months = 6B URLs
- Each entry maybe 500 bytes (short code, long URL, timestamps, count)
- 6B × 500 bytes = **3TB** (totally manageable)

Bandwidth:
- Writes: 40/sec × 500 bytes = 20KB/sec (nothing)
- Reads: 4000/sec × 500 bytes = 2MB/sec (also fine)

---

## 3. API Design

### Shorten URL
```
POST /api/shorten
Body: {
  "long_url": "https://example.com/some/very/long/url",
  "custom_alias": "my-link" (optional)
}

Response: {
  "short_url": "https://short.ly/aB3xY",
  "long_url": "...",
  "created_at": "2025-11-05..."
}
```

### Redirect
```
GET /{short_code}
→ 302 Redirect to long URL
```

### Analytics (maybe later)
```
GET /api/stats/{short_code}
→ returns click count, created date, etc.
```

---

## 4. Database Schema

Pretty simple table:
```sql
CREATE TABLE urls (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    long_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NULL,
    clicks INT DEFAULT 0,
    INDEX idx_short_code (short_code)  -- MUST HAVE for fast lookups
);
```

Index on short_code is critical - we'll be doing millions of lookups by short_code for redirects. Without index = slow table scan. With index = fast O(log n) lookup.

---

## 5. Generating short codes - the interesting part

Thought about a few approaches:

**Random strings?**
- Just generate random 6-7 char strings
- Problem: need to check DB for collisions every time
- Gets slower as table fills up
- Pass.

**Hash the URL?**
- MD5/SHA the long URL, take first 6-8 chars
- Same URL always gives same short code (could be feature?)
- Still need collision handling
- Meh.

**Base62 encoding - my choice**
- Use the auto-increment ID from database
- Convert to base62 (0-9, a-z, A-Z = 62 chars)
- No collisions possible!
- Math: 62^7 = 3.5 trillion URLs (way more than needed)

Example:
```
ID 1 → "b"
ID 62 → "10" 
ID 12345 → "3D7"
```

Going with Base62. Clean, fast, no collisions.

---

## 6. Architecture
```
         Users
           |
           v
    [Load Balancer]
           |
     ------+------
     |           |
   [API]       [API]    <- multiple servers
     |           |
     ------+------
           |
      -----+-----
      |         |
   [Redis]  [PostgreSQL]
```

**Load Balancer** - splits traffic across API servers

**API Servers** - handle requests, stateless so we can scale horizontally

**Redis** - THIS IS KEY! Cache short_code → long_url mappings. From my Redis testing earlier today, this gives ~3ms response vs 2000ms from DB. Game changer.

**PostgreSQL** - persistent storage, only hit on cache misses

---

## 7. How it works - Creating a short URL

1. POST comes in with long URL
2. Validate URL format
3. Check if we've already shortened this URL (optional - avoid duplicates)
4. Insert into DB, get auto-increment ID back
5. Convert ID to base62 = short_code
6. Store mapping in Redis too (pre-warm cache)
7. Return short URL to user

Pretty straightforward.

---

## 8. How it works - Redirecting (the hot path)

This is where Redis shines:

1. GET request comes in for /aB3xY
2. Check Redis first: `GET "aB3xY"`
3. **Cache hit (99% of time):**
   - Get long URL in ~3ms
   - Async increment click counter
   - Return 302 redirect
   - Done!
4. **Cache miss (1% of time):**
   - Hit PostgreSQL
   - Get long URL in ~50ms
   - Store in Redis for next time
   - Return 302 redirect

Redis handles 99% of traffic. Database barely gets touched. Beautiful.

---

## 9. Why Redis makes this system work

Without caching:
- Every redirect = DB query
- 4000 requests/sec = 4000 DB queries/sec
- Database chokes
- Slow redirects (50-200ms)
- Need expensive DB scaling

With Redis:
- 99% served from cache
- Only ~40 DB queries/sec (cache misses)
- Fast redirects (3-5ms) ← tested this myself today!
- Database relaxed
- Cheap horizontal scaling

Based on what I built earlier - Redis took my queries from 2010ms to 3ms. Same principle applies here but at massive scale.

---

## 10. Scaling thoughts

**More traffic?**
- Add more API servers behind load balancer
- They're stateless so just spin up more

**More data?**
- Shard database by short_code prefix (a-m on shard1, n-z on shard2)
- Or use consistent hashing

**Redis getting full?**
- Redis cluster with multiple nodes
- Or just add more RAM (Redis loves RAM)
- Could also set TTL but URLs don't change so maybe not needed

**Rate limiting**
- Use Redis to track requests per IP
- Block if > 100 requests/min or something
- (will build this tomorrow!)

---

## 11. Things that could go wrong

**Duplicate URLs** - someone shortens same URL twice
→ Could hash the long_url and check for existing entry first, return existing short code

**Expired URLs** - if we support expiration
→ Background job to clean up, or check on redirect

**Malicious URLs** - don't want to help spread malware
→ Validate against known bad domains, maybe integrate URL scanning API

**Redis dies** 
→ Fallback to DB (slower but works)
→ Use Redis replication for redundancy

---

## 12. If I got asked follow-ups in interview

**Q: What if you need to handle 1M req/sec?**
A: More API servers, Redis cluster, DB read replicas, maybe CDN for redirect responses

**Q: How to prevent abuse?**
A: Rate limiting with Redis (track by IP/user), require API key for programmatic access, CAPTCHA for public endpoint

**Q: What if Redis goes down?**
A: System still works but slower. Requests fallback to DB. Should have Redis replication (master-slave) with auto-failover.

---

## Summary of my design

**Key decisions:**
- Base62 for generating codes (no collisions)
- Redis for caching (3ms redirects)
- PostgreSQL for persistence
- Horizontal scaling approach

**Tech stack:**
- Node.js/Express (or could use Spring Boot)
- Redis
- PostgreSQL
- Nginx load balancer

**Performance goals met:**
- <5ms redirects (with Redis)
- <50ms creates
- Handles billions of URLs
- 99.9% uptime

**What I learned:**
- Thinking through capacity planning
- Importance of caching in read-heavy systems
- How to design APIs and schemas
- Practical application of Redis (connected to what I built today!)

This was a good exercise. Took longer than 30 min but feel like I understand URL shorteners now.