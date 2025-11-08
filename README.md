#  Task Management Application

[![CI/CD Pipeline](https://github.com/Ishan-gulkotwar/backend-mastery-2025/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Ishan-gulkotwar/backend-mastery-2025/actions/workflows/ci-cd.yml)
[![Tests](https://github.com/Ishan-gulkotwar/backend-mastery-2025/actions/workflows/tests.yml/badge.svg)](https://github.com/Ishan-gulkotwar/backend-mastery-2025/actions/workflows/tests.yml)

A production-ready, full-stack task management application built with modern web technologies, featuring Docker containerization, CI/CD pipelines, and comprehensive testing.

##  Features

### Backend (Node.js + Express)
- ✅ RESTful API with authentication (JWT)
- ✅ PostgreSQL database with connection pooling
- ✅ Redis caching for improved performance
- ✅ Rate limiting and security middleware (Helmet, CORS)
- ✅ Comprehensive error handling
- ✅ API documentation ready (Swagger setup)

### Frontend (React)
- ✅ Modern React with Hooks and Context API
- ✅ Responsive UI with light/dark theme
- ✅ Real-time task filtering and search
- ✅ Priority-based task sorting
- ✅ Toast notifications for user feedback
- ✅ Protected routes with authentication

### DevOps & Infrastructure
- ✅ Docker Compose for multi-container orchestration
- ✅ Automated CI/CD pipeline with GitHub Actions
- ✅ Automated testing and builds
- ✅ Security scanning
- ✅ Production-ready deployment configuration

##  Tech Stack

**Backend:**
- Node.js & Express.js
- PostgreSQL
- Redis
- JWT Authentication
- Bcrypt for password hashing

**Frontend:**
- React 18
- React Router v6
- Axios
- React Toastify
- CSS3 with custom themes

**DevOps:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Jest & Supertest (Testing)
- ESLint (Code quality)

##  Project Structure
```
backend-mastery-2025/
├── projects/
│   ├── task-api/              # Backend API
│   │   ├── src/
│   │   │   ├── config/        # Database, Redis configuration
│   │   │   ├── controllers/   # Business logic
│   │   │   ├── middleware/    # Auth, rate limiting
│   │   │   ├── routes/        # API endpoints
│   │   │   └── server.js      # Entry point
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── task-frontend/         # React frontend
│       ├── src/
│       │   ├── components/    # Reusable components
│       │   ├── context/       # Auth & Theme context
│       │   ├── pages/         # Dashboard, Login, Register
│       │   └── services/      # API integration
│       ├── Dockerfile
│       └── package.json
│
├── .github/
│   └── workflows/             # CI/CD pipelines
│       ├── ci-cd.yml
│       └── tests.yml
│
└── docker-compose.yml         # Multi-container setup
```

##  Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+ (for local development)

### Running with Docker (Recommended)

1. **Clone the repository:**
```bash
   git clone https://github.com/Ishan-gulkotwar/backend-mastery-2025.git
   cd backend-mastery-2025
```

2. **Start all services:**
```bash
   docker-compose up --build
```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - API Health: http://localhost:4000/health

### Local Development

**Backend:**
```bash
cd projects/task-api
npm install
cp .env.example .env  # Configure your environment
npm run dev
```

**Frontend:**
```bash
cd projects/task-frontend
npm install
npm start
```

##  Environment Variables

### Backend (.env)
```env
PORT=4000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskdb
DB_USER=postgres
DB_PASSWORD=your_password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

##  API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Tasks (Protected)
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get single task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Health
- `GET /health` - API health check

##  Testing
```bash
cd projects/task-api
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

##  CI/CD Pipeline

Automated workflows trigger on every push to `main`:

1. **Lint & Code Quality** - Code style checks
2. **Build Docker Images** - Validate Docker builds
3. **Security Scan** - Dependency vulnerability checks
4. **Deployment Ready** - Production readiness verification

##  Features Showcase

- **Authentication**: Secure JWT-based user authentication
- **Task Management**: CRUD operations with filtering and sorting
- **Search**: Real-time task search by title/description
- **Filters**: Filter by status (pending, in progress, completed) and priority
- **Themes**: Light/Dark mode toggle
- **Responsive**: Mobile-friendly UI
- **Performance**: Redis caching for optimized database queries
- **Security**: Rate limiting, helmet protection, CORS configured

##  Performance Optimizations

- Connection pooling for PostgreSQL
- Redis caching for frequently accessed data
- Rate limiting to prevent abuse
- Lazy loading of components
- Optimized Docker images with multi-stage builds

##  Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- SQL injection protection with parameterized queries
- CORS configuration
- Helmet.js security headers
- Rate limiting on API endpoints
- Input validation and sanitization

##  Best Practices Implemented

- ✅ Clean code architecture
- ✅ Error handling and logging
- ✅ Environment-based configuration
- ✅ Docker containerization
- ✅ CI/CD automation
- ✅ Code documentation
- ✅ Git workflow (feature branches, conventional commits)

##  Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Ishan Gulkotwar**
- GitHub: [@Ishan-gulkotwar](https://github.com/Ishan-gulkotwar)

## 🙏 Acknowledgments

Built as part of Backend Mastery 2025 learning journey.

