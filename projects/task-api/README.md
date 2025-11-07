# Task Management API

Production-ready RESTful API with authentication, caching, and rate limiting.

## Features
-  JWT Authentication
-  CRUD operations for tasks
-  PostgreSQL database
-  Redis caching (cache invalidation on updates)
-  Rate limiting (100 req/min)
-  Input validation
-  Security headers (Helmet)
-  CORS support

## Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Cache:** Redis
- **Auth:** JWT, bcrypt
- **Security:** Helmet, rate limiting

## Database Schema

### Users Table
- id (PRIMARY KEY)
- username (UNIQUE)
- email (UNIQUE)
- password_hash
- created_at, updated_at

### Tasks Table
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users)
- title
- description
- status (pending | in_progress | completed)
- priority (low | medium | high)
- due_date
- created_at, updated_at

## API Endpoints

### Authentication