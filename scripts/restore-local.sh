#!/bin/bash

# Local PostgreSQL restore script (no Docker)
# Usage: ./restore-local.sh <backup_file.sql | backup_file.sql.gz>
# Requires: psql and gunzip available locally

set -euo pipefail

DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"password"}
DB_NAME=${DB_NAME:-"house_design"}

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup_file.sql | backup_file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

export PGPASSWORD="${DB_PASSWORD}"

# If the dump includes CREATE DATABASE and is meant to be run against 'postgres', we will
# attempt to detect that by checking for "CREATE DATABASE" in the first 200 lines.
if gunzip -c "${BACKUP_FILE}" 2>/dev/null | head -n 200 | grep -qi "CREATE DATABASE"; then
  TARGET_DB="postgres"
else
  TARGET_DB="${DB_NAME}"
fi

# Prompt before dangerous action
echo "This will restore '${BACKUP_FILE}' into database '${TARGET_DB}' on ${DB_HOST}:${DB_PORT} as user ${DB_USER}."
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Restore cancelled"
  exit 0
fi

if [[ "${BACKUP_FILE}" == *.gz ]]; then
  echo "Restoring compressed backup into ${TARGET_DB}..."
  gunzip -c "${BACKUP_FILE}" | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TARGET_DB}"
else
  echo "Restoring plain SQL backup into ${TARGET_DB}..."
  psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TARGET_DB}" < "${BACKUP_FILE}"
fi

echo "Restore completed"

unset PGPASSWORD
