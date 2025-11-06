# Real-Time Notifications with Redis Pub/Sub

Live notification system using Redis PUBLISH/SUBSCRIBE pattern.

## What I Built
- Publisher API (sends notifications)
- Subscriber service (receives in real-time)
- Multi-channel support
- Broadcast functionality
- Priority alerts

## Real Test Results
```
 NEW MESSAGE on [notifications]
 Time: 2025-11-06T23:07:41.775Z
 Message: New user signed up!
 Data: { username: 'john_doe' }

 NEW MESSAGE on [alerts]
 PRIORITY: HIGH!
 Message: Server CPU at 90%!
```

## Redis Pub/Sub Pattern

**How it works:**
- Publishers PUBLISH messages to channels
- Subscribers SUBSCRIBE to channels
- Messages delivered instantly (push, not poll!)
- Fire-and-forget (no message persistence)

## Commands Used
- `PUBLISH` - Send message to channel
- `SUBSCRIBE` - Listen to channel(s)

## Real-World Applications
- Slack/Discord chat
- Live stock tickers
- Gaming events
- Microservices communication
- Real-time dashboards

## What I Learned
- Pub/Sub is fire-and-forget (no storage)
- Instant delivery to all subscribers
- Perfect for real-time features
- Different from message queues (Lists)