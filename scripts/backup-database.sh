#!/bin/bash

# PostgreSQL Database Backup Script
# Usage: ./backup-database.sh [output_directory]

set -e

# Configuration
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"password"}
DB_NAME=${DB_NAME:-"house_design"}

# Output directory
OUTPUT_DIR=${1:-"./backups"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${OUTPUT_DIR}/house_design_backup_${TIMESTAMP}.sql"

echo "=== PostgreSQL Database Backup ==="
echo "Database: ${DB_NAME}"
echo "Host: ${DB_HOST}:${DB_PORT}"
echo "User: ${DB_USER}"
echo "Output: ${BACKUP_FILE}"

# Create output directory if it doesn't exist
mkdir -p "${OUTPUT_DIR}"

# Export PGPASSWORD to avoid password prompt
export PGPASSWORD="${DB_PASSWORD}"

# Create full database dump
echo "Creating database dump..."
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=plain \
    --encoding=UTF8 \
    --no-owner \
    --no-privileges \
    > "${BACKUP_FILE}"

# Create schema-only dump
SCHEMA_FILE="${OUTPUT_DIR}/house_design_schema_${TIMESTAMP}.sql"
echo "Creating schema-only dump..."
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --schema-only \
    --format=plain \
    --encoding=UTF8 \
    --no-owner \
    --no-privileges \
    > "${SCHEMA_FILE}"

# Create data-only dump
DATA_FILE="${OUTPUT_DIR}/house_design_data_${TIMESTAMP}.sql"
echo "Creating data-only dump..."
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
    --verbose \
    --data-only \
    --format=plain \
    --encoding=UTF8 \
    --no-owner \
    --no-privileges \
    --column-inserts \
    > "${DATA_FILE}"

# Create compressed backup
echo "Creating compressed backup..."
gzip -c "${BACKUP_FILE}" > "${BACKUP_FILE}.gz"

# Create latest symlinks
ln -sf "house_design_backup_${TIMESTAMP}.sql" "${OUTPUT_DIR}/latest_backup.sql"
ln -sf "house_design_backup_${TIMESTAMP}.sql.gz" "${OUTPUT_DIR}/latest_backup.sql.gz"
ln -sf "house_design_schema_${TIMESTAMP}.sql" "${OUTPUT_DIR}/latest_schema.sql"
ln -sf "house_design_data_${TIMESTAMP}.sql" "${OUTPUT_DIR}/latest_data.sql"

echo "=== Backup Complete ==="
echo "Full backup: ${BACKUP_FILE}"
echo "Compressed: ${BACKUP_FILE}.gz"
echo "Schema only: ${SCHEMA_FILE}"
echo "Data only: ${DATA_FILE}"
echo ""
echo "Latest files are symlinked for easy access:"
echo "- ${OUTPUT_DIR}/latest_backup.sql"
echo "- ${OUTPUT_DIR}/latest_backup.sql.gz"
echo "- ${OUTPUT_DIR}/latest_schema.sql"
echo "- ${OUTPUT_DIR}/latest_data.sql"

# Clean PGPASSWORD
unset PGPASSWORD

echo ""
echo "To restore on VPS, run:"
echo "psql -h localhost -U postgres -d house_design < ${BACKUP_FILE}"