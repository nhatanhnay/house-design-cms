#!/bin/bash

# Local PostgreSQL backup script (no Docker)
# Usage: ./backup-local.sh [output_dir]
# Requires: pg_dump installed locally and accessible in PATH

set -euo pipefail

DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"password"}
DB_NAME=${DB_NAME:-"house_design"}

OUTPUT_DIR=${1:-"./backups"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${OUTPUT_DIR}/house_design_backup_${TIMESTAMP}.sql"

mkdir -p "${OUTPUT_DIR}"

export PGPASSWORD="${DB_PASSWORD}"

echo "Checking PostgreSQL connectivity..."
USE_SOCKET=false

# Prefer TCP (host+port) but if that fails and a local UNIX socket is available, fall back to socket.
if pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" >/dev/null 2>&1; then
  echo "Postgres reachable via TCP ${DB_HOST}:${DB_PORT}"
  USE_SOCKET=false
else
  echo "TCP connection to ${DB_HOST}:${DB_PORT} failed. Checking UNIX socket..."
  if pg_isready -U "${DB_USER}" >/dev/null 2>&1; then
    echo "Postgres reachable via local UNIX socket. Using socket for pg_dump."
    USE_SOCKET=true
  else
    echo "Error: cannot reach PostgreSQL via TCP or local socket. Aborting."
    unset PGPASSWORD
    exit 1
  fi
fi

echo "Backing up ${DB_NAME} to ${BACKUP_FILE}"
if [ "${USE_SOCKET}" = true ]; then
  # Use UNIX socket (omit -h and -p so libpq uses the socket)
  pg_dump -U "${DB_USER}" -d "${DB_NAME}" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=plain \
    --encoding=UTF8 \
    --no-owner \
    --no-privileges \
    > "${BACKUP_FILE}"
else
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
fi

gzip -f "${BACKUP_FILE}"

echo "Backup complete: ${BACKUP_FILE}.gz"

unset PGPASSWORD
