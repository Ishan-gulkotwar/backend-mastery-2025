# Rate Limiter with Redis

Production-ready rate limiting using multiple strategies.

## What I Built
- Fixed Window rate limiter (simple counter)
- Sliding Window rate limiter (accurate, no burst)
- Token Bucket rate limiter (handles bursts gracefully)
- Successfully blocks requests after limit exceeded

## Real Test Results
```
Request 1: remaining: 4 ✅
Request 2: remaining: 3 ✅
Request 3: remaining: 2 ✅
Request 4: remaining: 1 ✅
Request 5: remaining: 0 ✅
Request 6: 429 Rate limit exceeded! 🚫
```

## Three Strategies

### 1. Fixed Window
- Simple counter that resets every N seconds
- Fast and memory efficient
- Used by: Basic APIs, internal tools

### 2. Sliding Window
- Tracks each request with timestamps (Redis sorted sets)
- No burst issues at window boundaries
- Used by: High-precision APIs

### 3. Token Bucket
- Tokens refill over time, requests consume tokens
- Handles bursts gracefully
- Used by: Twitter API, AWS API Gateway

## How to Run
```bash
# Start Redis
docker run -d -p 6379:6379 redis:latest

# Run rate limiter
node rate-limiter.js          # Port 3001
node advanced-rate-limiter.js # Port 3002

# Test it (run 6 times quickly)
curl http://localhost:3001/api/data
```

## Redis Commands Used
- `SETEX` - Set with expiration
- `INCR` - Atomic increment
- `TTL` - Time to live
- `ZADD/ZCARD` - Sorted sets for sliding window

## What I Learned
- Rate limiting prevents API abuse
- Redis atomic operations are perfect for this
- Different strategies for different needs
- This is used by every major API (Twitter, GitHub, Stripe)

## Real-World Applications
- Prevent brute force attacks
- Fair resource allocation
- Protect against DDoS
- Enforce API quotas