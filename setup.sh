#!/bin/bash

echo "🚀 Employee Management System Setup"
echo "==================================="

# 1. Check prerequisites
echo "🔍 Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed."

# 2. Create directories
echo "📁 Creating directories..."
mkdir -p scripts logs secrets

# 3. Generate JWT secret
echo "🔑 Generating JWT secret..."
JWT_SECRET=$(openssl rand -base64 32)
echo "Generated JWT secret: ${JWT_SECRET:0:20}..."

# 4. Create environment files from examples
echo "📝 Creating environment files..."

# Database password
read -p "Enter PostgreSQL password [default: Naruto0511]: " DB_PASSWORD
DB_PASSWORD=${DB_PASSWORD:-Naruto0511}

# Email configuration
read -p "Enter email address for notifications (optional): " EMAIL_USER
read -p "Enter email password/app password (optional): " EMAIL_PASS

# Create .env.db
cat > .env.db << EOF
# PostgreSQL Password
POSTGRES_PASSWORD=${DB_PASSWORD}
EOF
chmod 600 .env.db

# Create .env.api
cat > .env.api << EOF
# JWT Secrets
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRATION=1d
REFRESH_TOKEN_EXPIRATION=7d

# Database Password
DB_PASSWORD=${DB_PASSWORD}

# Redis Password (optional)
REDIS_PASSWORD=

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=${EMAIL_USER:-}
EMAIL_PASS=${EMAIL_PASS:-}
EMAIL_FROM=noreply@example.com
EOF
chmod 600 .env.api

# Create .env.redis (empty for now)
cat > .env.redis << EOF
# Redis Password (optional)
REDIS_PASSWORD=
EOF
chmod 600 .env.redis

echo "✅ Environment files created."

# 5. Create init script
cat > scripts/init-db.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Initializing PostgreSQL database..."

# Wait for PostgreSQL to be ready
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"
EOF
chmod +x scripts/init-db.sh

# 6. Build and start containers
echo "🐳 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# 7. Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# 8. Check service status
echo "🔍 Checking service status..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ All services are running!"
    echo ""
    echo "📊 Service Status:"
    echo "------------------"
    echo "API:          http://localhost:3000"
    echo "API Docs:     http://localhost:3000/api/docs"
    echo "Health Check: http://localhost:3000/api/v1/health"
    echo "Database:     localhost:5432"
    echo "Redis:        localhost:6379"
    echo ""
    echo "📝 Next steps:"
    echo "1. Run database migrations: docker-compose exec api npm run migration:run"
    echo "2. Seed database (optional): docker-compose exec api npm run seed"
    echo "3. View logs: docker-compose logs -f api"
    echo ""
    echo "🎉 Setup completed successfully!"
else
    echo "❌ Some services failed to start. Check logs: docker-compose logs"
    exit 1
fi