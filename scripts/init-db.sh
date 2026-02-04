#!/bin/bash
set -e

echo "🚀 Starting database initialization..."

# Wait for PostgreSQL to start
echo "⏳ Waiting for PostgreSQL to start..."
sleep 5

# Create extensions in the target database
echo "🔧 Creating database extensions..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Enable UUID generation
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Enable cryptographic functions
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    
    -- Output success message
    SELECT '✅ Database initialized successfully!' as message;
EOSQL

echo "🎉 Database initialization completed!"