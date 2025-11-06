const express = require('express');
const redis = require('redis');

const app = express();
app.use(express.json());
const PORT = 3005;

const redisClient = redis.createClient({
  socket: { host: 'localhost', port: 6379 }
});

redisClient.connect().catch(console.error);
redisClient.on('connect', () => console.log('✅ Publisher connected to Redis'));

/**
 * Publish notification to a channel
 * PUBLISH - Send message to all subscribers
 */
app.post('/notify/:channel', async (req, res) => {
  const { channel } = req.params;
  const { message, priority, data } = req.body;
  
  const notification = {
    message,
    priority: priority || 'normal',
    data: data || {},
    timestamp: new Date().toISOString()
  };
  
  try {
    // PUBLISH sends to all subscribers on this channel
    const subscriberCount = await redisClient.publish(
      channel,
      JSON.stringify(notification)
    );
    
    res.json({
      message: 'Notification sent',
      channel,
      subscriberCount,
      notification
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Broadcast to multiple channels
 */
app.post('/broadcast', async (req, res) => {
  const { channels, message } = req.body;
  
  const notification = {
    message,
    timestamp: new Date().toISOString(),
    broadcast: true
  };
  
  try {
    const results = [];
    
    for (const channel of channels) {
      const count = await redisClient.publish(
        channel,
        JSON.stringify(notification)
      );
      results.push({ channel, subscriberCount: count });
    }
    
    res.json({
      message: 'Broadcast sent',
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send alert (high priority)
 */
app.post('/alert', async (req, res) => {
  const { message, userId } = req.body;
  
  const alert = {
    type: 'ALERT',
    message,
    userId,
    priority: 'high',
    timestamp: new Date().toISOString()
  };
  
  try {
    const count = await redisClient.publish(
      'alerts',
      JSON.stringify(alert)
    );
    
    res.json({
      message: 'Alert sent',
      subscriberCount: count,
      alert
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`📢 Publisher API running on http://localhost:${PORT}`);
  console.log('\n📝 Send notifications:');
  console.log('  POST /notify/:channel  - Send to specific channel');
  console.log('  POST /broadcast        - Send to multiple channels');
  console.log('  POST /alert            - Send high-priority alert\n');
});