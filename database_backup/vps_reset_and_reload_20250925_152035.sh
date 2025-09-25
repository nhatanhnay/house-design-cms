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

echo "🗑️  Step 1: Clearing all data from VPS database..."

# Stop any connections and clear data
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << SQL
-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Clear all data from tables
TRUNCATE TABLE articles RESTART IDENTITY CASCADE;
TRUNCATE TABLE posts RESTART IDENTITY CASCADE;
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;
TRUNCATE TABLE admin RESTART IDENTITY CASCADE;
TRUNCATE TABLE home_content RESTART IDENTITY CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Reset sequences
ALTER SEQUENCE admin_id_seq RESTART WITH 1;
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE articles_id_seq RESTART WITH 1;
ALTER SEQUENCE posts_id_seq RESTART WITH 1;
ALTER SEQUENCE home_content_id_seq RESTART WITH 1;
SQL

if [ $? -eq 0 ]; then
    echo "✅ VPS database data cleared successfully!"
else
    echo "❌ Failed to clear VPS database data!"
    exit 1
fi

echo ""
echo "📁 Step 2: Loading clean structure to VPS database..."

# Load the clean structure
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "house_design_clean_schema_20250925_152035.sql"

if [ $? -eq 0 ]; then
    echo "✅ Clean structure loaded to VPS successfully!"
else
    echo "❌ Failed to load structure to VPS!"
    exit 1
fi
