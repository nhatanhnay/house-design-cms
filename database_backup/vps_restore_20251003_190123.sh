#!/bin/bash
# VPS Database Restore Script
# This script restores the full database backup to VPS

# Database connection details for VPS
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-house_design}

echo "⚠️  WARNING: This will REPLACE ALL DATA in VPS database!"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""
read -p "Are you sure you want to continue? (type 'RESTORE' to confirm): " -r
echo

if [[ $REPLY != "RESTORE" ]]; then
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
echo "📁 Step 2: Restoring full backup to VPS database..."

# Restore the full backup (ignore role errors)
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "house_design_full_backup_20251003_190123.sql" 2>&1 | grep -v "role.*does not exist"

if [ $? -eq 0 ]; then
    echo "✅ Full backup restored to VPS successfully!"

    # Count restored data
    echo ""
    echo "📊 Database statistics:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << SQL
SELECT 'Categories: ' || COUNT(*) FROM categories;
SELECT 'Posts: ' || COUNT(*) FROM posts;
SELECT 'Articles: ' || COUNT(*) FROM articles;
SQL
else
    echo "❌ Failed to restore backup to VPS!"
    exit 1
fi
