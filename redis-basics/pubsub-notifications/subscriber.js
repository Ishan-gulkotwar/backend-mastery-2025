const redis = require('redis');

// Create subscriber client
const subscriber = redis.createClient({
  socket: { host: 'localhost', port: 6379 }
});

subscriber.connect().catch(console.error);

subscriber.on('connect', () => {
  console.log(' Subscriber connected to Redis\n');
});

// Subscribe to channels
const channels = ['notifications', 'alerts', 'updates'];

async function subscribeToChannels() {
  for (const channel of channels) {
    await subscriber.subscribe(channel, (message) => {
      const notification = JSON.parse(message);
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(` NEW MESSAGE on [${channel}]`);
      console.log(` Time: ${notification.timestamp}`);
      console.log(` Message: ${notification.message}`);
      
      if (notification.priority === 'high') {
        console.log(' PRIORITY: HIGH!');
      }
      
      if (notification.data && Object.keys(notification.data).length > 0) {
        console.log(` Data:`, notification.data);
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
    
    console.log(` Subscribed to: ${channel}`);
  }
  
  console.log(`\n Listening on ${channels.length} channels...`);
  console.log('   (Waiting for notifications...)\n');
}

subscribeToChannels();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n Unsubscribing...');
  await subscriber.quit();
  process.exit(0);
});