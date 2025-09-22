#!/bin/bash

# PostgreSQL Database Restore Script
# Usage: ./restore-database.sh [backup_file]

set -e

# Configuration
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"password"}
DB_NAME=${DB_NAME:-"house_design"}

# Backup file
BACKUP_FILE=${1:-"./backups/latest_backup.sql"}

echo "=== PostgreSQL Database Restore ==="
echo "Database: ${DB_NAME}"
echo "Host: ${DB_HOST}:${DB_PORT}"
echo "User: ${DB_USER}"
echo "Backup file: ${BACKUP_FILE}"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file '${BACKUP_FILE}' not found!"
    echo "Available backups:"
    ls -la ./backups/*.sql 2>/dev/null || echo "No backup files found in ./backups/"
    exit 1
fi

# Check if it's a compressed file
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    echo "Detected compressed backup file"
    TEMP_FILE="/tmp/house_design_restore_$(date +%s).sql"
    gunzip -c "${BACKUP_FILE}" > "${TEMP_FILE}"
    BACKUP_FILE="${TEMP_FILE}"
    CLEANUP_TEMP=true
else
    CLEANUP_TEMP=false
fi

# Export PGPASSWORD to avoid password prompt
export PGPASSWORD="${DB_PASSWORD}"

# Test connection
echo "Testing database connection..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "postgres" -c "SELECT version();" > /dev/null

# Ask for confirmation
echo ""
echo "WARNING: This will DROP and recreate the database '${DB_NAME}'"
read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Restore database
echo "Restoring database..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "postgres" < "${BACKUP_FILE}"

echo "=== Restore Complete ==="
echo "Database '${DB_NAME}' has been restored successfully"

# Cleanup temporary file if created
if [ "$CLEANUP_TEMP" = true ] && [ -f "${TEMP_FILE}" ]; then
    rm -f "${TEMP_FILE}"
    echo "Temporary file cleaned up"
fi

# Clean PGPASSWORD
unset PGPASSWORD

echo ""
echo "You can now start your application with the restored database."