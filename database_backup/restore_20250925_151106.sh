#!/bin/bash
# Restore script for backup created on Thu Sep 25 15:11:14 +07 2025

# Database connection details
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-house_design}

echo "Restoring database from backup..."
echo "⚠️  WARNING: This will DROP the existing database and recreate it!"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres < "house_design_schema_20250925_151106.sql"
    echo "✅ Database restored successfully!"
else
    echo "❌ Restore cancelled."
fi
