# Real-Time Leaderboard with Redis Sorted Sets

Production-ready gaming leaderboard using Redis ZSET data structure.

## What I Built
- Real-time player rankings
- Score updates and increments
- Leaderboard context (players around you)
- Score range queries
- Complete CRUD operations
- Demo data seeder

## Real Test Results
```
rank username      score
---- --------      -----
   1 ishan         10500  
   2 ninja          9850
   3 shroud         9720
   4 pokimane       9680
```

## Redis Sorted Sets (ZSET)

**Why Sorted Sets are perfect for leaderboards:**
- O(log N) insert/update
- O(log N) rank lookup
- O(1) score retrieval
- Automatic sorting by score
- Range queries by rank or score

## Redis Commands Used

| Command | Purpose | Time Complexity |
|---------|---------|-----------------|
| ZADD | Add/update player score | O(log N) |
| ZINCRBY | Increment score | O(log N) |
| ZREVRANK | Get rank (desc) | O(log N) |
| ZREVRANGE | Get top N players | O(log N + M) |
| ZSCORE | Get player score | O(1) |
| ZCARD | Count total players | O(1) |
| ZRANGEBYSCORE | Get players in range | O(log N + M) |
| ZREM | Remove player | O(log N) |

## API Endpoints

### Add/Update Score
```bash
POST /player/:username/score
Body: { "score": 10000 }
```

### Increment Score
```bash
POST /player/:username/increment
Body: { "points": 500 }
```

### Get Top N Players
```bash
GET /leaderboard/top/10
```

### Get Player Info
```bash
GET /player/:username
Returns: rank, score, percentile
```

### Get Context (players around you)
```bash
GET /player/:username/context
Returns: 2 above + you + 2 below
```

### Get Players by Score Range
```bash
GET /leaderboard/range/8000/9000
```

## How to Run
```bash
# Make sure Redis is running
docker ps

# Start server
node leaderboard.js

# Seed demo data
Invoke-RestMethod -Method Post -Uri http://localhost:3003/seed

# View leaderboard
Invoke-RestMethod -Uri http://localhost:3003/leaderboard/top/10
```

## Performance

**Tested with 11 players:**
- Insert: ~1ms
- Rank lookup: ~1ms
- Top 10 query: ~2ms

**Scales to millions:**
- Can handle 100K+ players
- Sub-10ms queries even at scale
- Memory efficient (score + username only)

## Real-World Applications

### Gaming
- Fortnite, League of Legends rankings
- High scores in mobile games
- Clan/guild leaderboards

### Social Media
- Trending posts (Reddit, Hacker News)
- Most liked/shared content
- Influencer rankings

### E-commerce
- Best sellers
- Top rated products
- Price sorted listings

### Analytics
- Real-time dashboards
- Top visitors/customers
- Performance metrics

## What I Learned

- Sorted Sets are O(log N) for most operations
- Perfect for any ranking/scoring system
- Atomic operations prevent race conditions
- Range queries are super flexible
- Used by: Stack Overflow, GitHub, Twitter

## Next Steps
- Add this to my Task Management API (task priorities!)
- Implement time-based decay (trending algorithm)
- Add real-time updates with WebSockets