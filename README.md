# Employee Management System

A comprehensive employee management system built with NestJS. Features include authentication, employee CRUD, attendance tracking, email notifications, and report generation.

## ✨ Features

- ✅ **Authentication System**
  - Register, Login, Logout
  - Forgot Password, Password Reset
  - JWT-based authentication with refresh tokens
  - Role-based access control (Admin, Manager, Employee)

- ✅ **Employee Management**
  - CRUD operations for employees
  - Fields: names, email, employee identifier, phone number
  - Profile management

- ✅ **Attendance Management**
  - Clock in/out system
  - Daily attendance tracking
  - Status tracking (present, absent, late, leave)

- ✅ **Email Notifications**
  - Queue-based email processing
  - Attendance confirmation emails
  - Password reset emails
  - Welcome emails

- ✅ **Report Generation**
  - PDF reports using jsPDF
  - Excel reports using ExcelJS
  - Daily attendance reports

- ✅ **Production Ready**
  - Logging with Winston
  - Health checks
  - Rate limiting
  - Request validation
  - Comprehensive error handling
  - Docker support
  - GitHub Actions CI/CD

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | NestJS v11 |
| **Language** | TypeScript |
| **Database** | PostgreSQL with TypeORM |
| **Authentication** | PassportJS (JWT, Local) |
| **Queues** | Bull with Redis |
| **Email** | Nodemailer |
| **Reports** | jsPDF, ExcelJS |
| **Documentation** | Swagger/OpenAPI |
| **Testing** | Jest |
| **Container** | Docker & Docker Compose |
| **CI/CD** | GitHub Actions |

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose (recommended)
- OR: PostgreSQL 15+ and Redis 7+

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/YannickZahinda/employee-management-system.git
cd employee-management-system
```

### 2. Environment Setup

```bash
# Copy environment variables template
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

### 3. Start with Docker (Recommended)

```bash
# Build and start all services
docker compose up --build

# Or run in detached mode
docker compose up -d --build

# View logs
docker compose logs -f api
```

### 4. Database Setup

```bash
# Run migrations and seed admin user (if not using Docker)
npm run db:setup

# OR with Docker (after containers are running)
docker-compose exec api npm run db:setup
```

### 5. Access the Application

| Service | URL | Credentials |
|---------|-----|-------------|
| **API** | http://localhost:3000 | - |
| **API Documentation (Swagger)** | http://localhost:3000/api/docs | - |
| **Health Check** | http://localhost:3000/api/v1/health | - |
| **PostgreSQL** | localhost:5432 | User: `yannick`, Database: `employee_management` |
| **Redis** | localhost:6379 | - |

### 6. Initial Admin User

The system automatically creates an admin user:
- **Email:** `admin@company.com`
- **Password:** `Admin123!` (Change after first login!)

To manually seed the admin user:
```bash
docker-compose exec api npm run seed:admin
```

## 📁 Project Structure

```
employee-management-system/
├── src/
│   ├── common/           # Shared utilities, guards, decorators
│   ├── config/           # Configuration module
│   ├── database/         # Database configuration & migrations
│   ├── modules/          # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── employee/     # Employee management
│   │   ├── attendance/   # Attendance tracking
│   │   ├── queue/        # Email queue processing
│   │   └── report/       # Report generation
│   └── shared/           # Shared services (logger, etc.)
├── test/                 # Test files
├── scripts/              # Utility scripts
├── docker/               # Docker configuration
└── .github/workflows/    # CI/CD pipelines
```

## 🔐 Environment Variables

Create a `.env` file based on `.env.example`:

```env
# ========== DATABASE ==========
DB_HOST=localhost
DB_PORT=5432
DB_USER=yannick
DB_PASSWORD=Naruto0511
DB_DATABASE=employee_management
DB_SSL=false

# ========== REDIS ==========
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ========== APPLICATION ==========
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=1d
REFRESH_TOKEN_EXPIRATION=7d

# ========== CORS ==========
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# ========== EMAIL (Optional) ==========
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@example.com

# ========== RATE LIMITING ==========
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# ========== SWAGGER ==========
SWAGGER_ENABLED=true
```

## 📖 API Documentation

Once running, access the complete API documentation:

```bash
# Swagger UI
http://localhost:3000/api/docs

# Or view the OpenAPI spec
http://localhost:3000/api/docs-json
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run specific test suite
npm run test:attendance


```

## 🔄 Database Migrations

```bash
# Generate new migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# With Docker
docker-compose exec api npm run migration:run
```

## 🐳 Docker Commands

```bash
# Build and start
docker compose up --build

# Start in background
docker compose up -d

# View logs
docker compose logs -f api
docker compose logs -f db

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v

# Rebuild specific service
docker compose build api

# Execute commands in container
docker compose exec api npm test
docker compose exec db psql -U yannick -d employee_management
```

## 🚢 Deployment

### Docker Deployment (Coming soon)

```bash
# Build production image
docker build -t employee-management-system:latest .

# Run production container
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-db-password \
  --name employee-management \
  employee-management-system:latest
```

### Environment Variables for Production

For production deployment, ensure these environment variables are set:

```bash
NODE_ENV=production
DB_SSL=true
SWAGGER_ENABLED=false
JWT_SECRET=strong-random-secret-from-key-vault
```

## 📊 Health Checks

The application provides health endpoints for monitoring:

```bash
# Full health check
curl http://localhost:3000/api/v1/health

```

## 🔧 Development

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run start:dev

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

## 👥 API Usage Examples

### Authentication

```bash
# Register a new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "User123!",
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "Admin123!"
  }'
```

### Employee Management (Admin Only)

```bash
# Create employee (requires admin token)
curl -X POST http://localhost:3000/api/v1/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "email": "employee@company.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "password": "Employee123!",
    "role": "employee"
  }'
```

### Attendance (Employee)

```bash
# Clock in
curl -X POST http://localhost:3000/api/v1/attendance/clock-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <EMPLOYEE_TOKEN>" \
  -d '{"time": "09:00:00"}'

--> Next feature: let server handle the time

# Clock out
curl -X POST http://localhost:3000/api/v1/attendance/clock-out \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <EMPLOYEE_TOKEN>" \
  -d '{"time": "17:00:00"}'
```

## 🐛 Troubleshooting

### Common Issues

1. **Database connection failed:**
   ```bash
   # Check PostgreSQL is running
   docker compose ps db
   
   # Test connection
   docker compose exec db pg_isready -U yannick
   ```

2. **Redis connection failed:**
   ```bash
   # Check Redis is running
   docker compose exec redis redis-cli ping
   ```

3. **Migrations not running:**
   ```bash
   # Manual migration
   docker compose exec api npx typeorm migration:run -d dist/src/database/data-source.js
   ```

4. **Port already in use:**
   ```bash
   # Check what's using port 3000
   sudo lsof -i :3000
   ```

### Docker Cleanup

```bash
# Remove all unused Docker resources
docker system prune -a --volumes

# Remove specific images
docker rmi employee-management-system:latest

# Remove containers
docker compose down -v --rmi all
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📞 Support

For support, email ymulikuza@gmail.com or open an issue in the GitHub repository.

---

**Happy Coding!** 🚀

Built with ❤️ using NestJS