const express = require('express');
const redis = require('redis');

const app = express();
app.use(express.json());
const PORT = 3003;

const redisClient = redis.createClient({
  socket: { host: 'localhost', port: 6379 }
});

redisClient.connect().catch(console.error);

redisClient.on('connect', () => {
  console.log(' Connected to Redis');
});

// ==================== LEADERBOARD OPERATIONS ====================

/**
 * Add or update player score
 * Redis Command: ZADD
 */
app.post('/player/:username/score', async (req, res) => {
  const { username } = req.params;
  const { score } = req.body;
  
  if (!score || isNaN(score)) {
    return res.status(400).json({ error: 'Valid score required' });
  }
  
  try {
    // ZADD adds member with score to sorted set
    await redisClient.zAdd('leaderboard', {
      score: parseInt(score),
      value: username
    });
    
    // Get player's rank (0-indexed, so add 1)
    const rank = await redisClient.zRevRank('leaderboard', username);
    
    res.json({
      message: 'Score updated',
      player: username,
      score: parseInt(score),
      rank: rank + 1,
      totalPlayers: await redisClient.zCard('leaderboard')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Increment player score
 * Redis Command: ZINCRBY
 */
app.post('/player/:username/increment', async (req, res) => {
  const { username } = req.params;
  const { points } = req.body;
  
  if (!points || isNaN(points)) {
    return res.status(400).json({ error: 'Valid points required' });
  }
  
  try {
    // ZINCRBY atomically increments score
    const newScore = await redisClient.zIncrBy('leaderboard', parseInt(points), username);
    const rank = await redisClient.zRevRank('leaderboard', username);
    
    res.json({
      message: `Added ${points} points`,
      player: username,
      newScore: parseInt(newScore),
      rank: rank + 1
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get top N players
 * Redis Command: ZREVRANGE with WITHSCORES
 */
app.get('/leaderboard/top/:n', async (req, res) => {
  const n = parseInt(req.params.n) || 10;
  
  try {
    // ZREVRANGE gets members in reverse order (highest first)
    const players = await redisClient.zRangeWithScores('leaderboard', 0, n - 1, {
      REV: true
    });
    
    const leaderboard = players.map((player, index) => ({
      rank: index + 1,
      username: player.value,
      score: player.score
    }));
    
    res.json({
      leaderboard,
      totalPlayers: await redisClient.zCard('leaderboard')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get player rank and score
 * Redis Commands: ZREVRANK, ZSCORE
 */
app.get('/player/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const score = await redisClient.zScore('leaderboard', username);
    
    if (score === null) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const rank = await redisClient.zRevRank('leaderboard', username);
    const totalPlayers = await redisClient.zCard('leaderboard');
    
    res.json({
      username,
      score: parseInt(score),
      rank: rank + 1,
      totalPlayers,
      percentile: ((totalPlayers - rank) / totalPlayers * 100).toFixed(1)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get players around a specific player
 * Shows context: 2 above, player, 2 below
 */
app.get('/player/:username/context', async (req, res) => {
  const { username } = req.params;
  
  try {
    const rank = await redisClient.zRevRank('leaderboard', username);
    
    if (rank === null) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // Get 2 players above and 2 below
    const start = Math.max(0, rank - 2);
    const end = rank + 2;
    
    const players = await redisClient.zRangeWithScores('leaderboard', start, end, {
      REV: true
    });
    
    const context = players.map((player, index) => ({
      rank: start + index + 1,
      username: player.value,
      score: player.score,
      isCurrentPlayer: player.value === username
    }));
    
    res.json({ context });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get players by score range
 * Redis Command: ZRANGEBYSCORE
 */
app.get('/leaderboard/range/:min/:max', async (req, res) => {
  const { min, max } = req.params;
  
  try {
    const players = await redisClient.zRangeByScoreWithScores(
      'leaderboard',
      parseInt(min),
      parseInt(max),
      { REV: true }
    );
    
    const results = players.map(player => ({
      username: player.value,
      score: player.score
    }));
    
    res.json({
      scoreRange: `${min}-${max}`,
      players: results,
      count: results.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete player from leaderboard
 * Redis Command: ZREM
 */
app.delete('/player/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const removed = await redisClient.zRem('leaderboard', username);
    
    if (removed === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json({
      message: 'Player removed',
      username
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Clear entire leaderboard
 */
app.delete('/leaderboard', async (req, res) => {
  try {
    await redisClient.del('leaderboard');
    res.json({ message: 'Leaderboard cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get leaderboard stats
 */
app.get('/stats', async (req, res) => {
  try {
    const totalPlayers = await redisClient.zCard('leaderboard');
    
    if (totalPlayers === 0) {
      return res.json({
        totalPlayers: 0,
        message: 'No players yet'
      });
    }
    
    const topPlayer = await redisClient.zRangeWithScores('leaderboard', -1, -1);
    const lowestPlayer = await redisClient.zRangeWithScores('leaderboard', 0, 0);
    
    res.json({
      totalPlayers,
      highestScore: topPlayer[0].score,
      topPlayer: topPlayer[0].value,
      lowestScore: lowestPlayer[0].score,
      lowestPlayer: lowestPlayer[0].value
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DEMO DATA SEEDER ====================

app.post('/seed', async (req, res) => {
  try {
    const demoPlayers = [
      { username: 'ninja', score: 9850 },
      { username: 'shroud', score: 9720 },
      { username: 'pokimane', score: 9680 },
      { username: 'tfue', score: 9550 },
      { username: 'myth', score: 9420 },
      { username: 'pewdiepie', score: 9300 },
      { username: 'markiplier', score: 9150 },
      { username: 'jacksepticeye', score: 8900 },
      { username: 'valkyrae', score: 8750 },
      { username: 'sykkuno', score: 8600 }
    ];
    
    for (const player of demoPlayers) {
      await redisClient.zAdd('leaderboard', {
        score: player.score,
        value: player.username
      });
    }
    
    res.json({
      message: 'Demo data seeded',
      players: demoPlayers.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(` Leaderboard API running on http://localhost:${PORT}`);
  console.log('\n Try these commands:');
  console.log('\n1. Seed demo data:');
  console.log('   curl -X POST http://localhost:3003/seed\n');
  console.log('2. View top 10:');
  console.log('   curl http://localhost:3003/leaderboard/top/10\n');
  console.log('3. Add your score:');
  console.log('   curl -X POST http://localhost:3003/player/yourname/score -H "Content-Type: application/json" -d "{\\"score\\": 10000}"\n');
  console.log('4. Check your rank:');
  console.log('   curl http://localhost:3003/player/yourname\n');
});