#!/bin/bash
set -e

echo "🚀 Initializing PostgreSQL database..."

until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Create additional extensions if needed
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    
    -- Set timezone
    SET timezone = 'UTC';
    
    -- Create schema if needed
    -- CREATE SCHEMA IF NOT EXISTS employee_schema;
    
    -- Set search path (optional)
    -- ALTER DATABASE $POSTGRES_DB SET search_path TO employee_schema, public;
    
    -- You can add custom initialization here
    -- CREATE TABLE IF NOT EXISTS example (...);
EOSQL

echo "✅ Database initialization completed!"