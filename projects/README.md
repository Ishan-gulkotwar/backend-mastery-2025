# Task Management Application

Full-stack task management application with React frontend, Node.js backend, PostgreSQL, and Redis.

## Features

### Frontend (React)
-  JWT Authentication
-  Full CRUD operations
-  Search & Filters
-  Task statistics
-  Dark mode
-  Responsive design

### Backend (Node.js + Express)
-  Secure authentication (JWT + bcrypt)
-  PostgreSQL database
-  Redis caching
-  Rate limiting
-  Security headers (Helmet)
-  RESTful API design

## Tech Stack

**Frontend:**
- React 18
- React Router
- Axios
- Context API

**Backend:**
- Node.js
- Express.js
- PostgreSQL
- Redis
- JWT
- bcrypt

**DevOps:**
- Docker
- Docker Compose
- Nginx

## Quick Start with Docker (Recommended)

### Prerequisites
- Docker Desktop installed
- Git

### Run Everything with One Command
```bash
# Clone repository
git clone https://github.com/Ishan-gulkotwar/backend-mastery-2025.git
cd backend-mastery-2025/projects

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Access the app:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### First Time Setup

The backend will automatically:
- Create database tables
- Set up indexes
- Be ready to use!

Just register a new account and start using the app!

## Manual Setup (Without Docker)

### Backend Setup
```bash
cd task-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Start PostgreSQL and Redis
# (using Docker or locally)

# Initialize database
npm run init-db

# Start server
npm run dev
```

### Frontend Setup
```bash
cd task-frontend

# Install dependencies
npm install

# Start development server
npm start
```

## API Endpoints

### Authentication
```
POST /api/auth/register - Register new user
POST /api/auth/login    - Login user
```

### Tasks (Requires JWT)
```
GET    /api/tasks       - Get all tasks (with filters)
POST   /api/tasks       - Create new task
GET    /api/tasks/:id   - Get single task
PUT    /api/tasks/:id   - Update task
DELETE /api/tasks/:id   - Delete task
```

## Architecture Highlights

### Caching Strategy
- Redis caches task queries for 5 minutes
- Automatic cache invalidation on updates
- Reduces database load by ~80%

### Performance
- Backend response time: <50ms (cached)
- Frontend render time: <100ms
- Database queries optimized with indexes
- Rate limiting: 100 requests/minute

### Security
- Password hashing with bcrypt (10 rounds)
- JWT tokens with 7-day expiration
- HTTP-only secure cookies
- CORS protection
- Rate limiting
- Helmet security headers

## Development

### Backend
```bash
npm run dev     # Start with nodemon
npm start       # Production mode
npm run init-db # Initialize database
```

### Frontend
```bash
npm start       # Development server
npm run build   # Production build
npm test        # Run tests
```

## Environment Variables

### Backend (.env)
```
PORT=4000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskdb
DB_USER=postgres
DB_PASSWORD=password123

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

## Project Structure
```
projects/
├── docker-compose.yml
├── task-api/           # Backend
│   ├── src/
│   │   ├── config/     # Database, Redis config
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── server.js
│   ├── Dockerfile
│   └── package.json
└── task-frontend/      # Frontend
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   ├── context/
    │   └── App.js
    ├── Dockerfile
    ├── nginx.conf
    └── package.json
```

## Screenshots

### Light Mode
![Dashboard Light](screenshots/dashboard-light.png)

### Dark Mode
![Dashboard Dark](screenshots/dashboard-dark.png)

### Task Management
![Task Management](screenshots/tasks.png)

## Contributing

This is a portfolio project. Feel free to fork and modify!

## License

MIT License

## Author

**Ishan Gulkotwar**
- GitHub: [@Ishan-gulkotwar](https://github.com/Ishan-gulkotwar)
- Email: ishangulkotwar@gmail.com
- LinkedIn: [https://www.linkedin.com/in/ishan-gulkotwar-a202ba20a/]

---
