#!/bin/bash
# VPS Database Reset and Reload Script
# This script clears the VPS database and loads the clean structure

# Database connection details for VPS
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-house_design}

echo "⚠️  WARNING: This will DELETE ALL DATA from VPS database and reload structure!"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""
read -p "Are you sure you want to continue? (type 'RESET VPS' to confirm): " -r
echo

if [[ $REPLY != "RESET VPS" ]]; then
    echo "❌ Operation cancelled."
    exit 1
fi

echo "🗑️  Step 1: Dropping and recreating VPS database..."

# Drop and recreate database to avoid constraint conflicts
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres << SQL
-- Terminate all connections to the database
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME';

-- Drop and recreate database
DROP DATABASE IF EXISTS "$DB_NAME";
CREATE DATABASE "$DB_NAME";
SQL

if [ $? -eq 0 ]; then
    echo "✅ VPS database recreated successfully!"
else
    echo "❌ Failed to recreate VPS database!"
    exit 1
fi

echo ""
echo "📁 Step 2: Loading clean structure to VPS database..."

# Load the clean structure (ignore role errors)
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "house_design_clean_schema_20250925_152720.sql" 2>&1 | grep -v "role.*does not exist"

if [ $? -eq 0 ]; then
    echo "✅ Clean structure loaded to VPS successfully!"
else
    echo "❌ Failed to load structure to VPS!"
    exit 1
fi
