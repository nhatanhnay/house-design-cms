#!/bin/bash

# VPS PostgreSQL Restore Fix Script
# This script fixes compatibility issues when restoring newer PostgreSQL dumps to older versions

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "This script fixes PostgreSQL version compatibility issues"
    exit 1
fi

BACKUP_FILE="$1"
FIXED_FILE="/tmp/house_design_fixed_$(date +%s).sql"

echo "Fixing PostgreSQL version compatibility issues..."

# Extract and fix the backup file
gunzip -c "${BACKUP_FILE}" | \
    sed 's/LOCALE_PROVIDER = libc//g' | \
    sed 's/LC_COLLATE = [^;]*//g' | \
    sed 's/LC_CTYPE = [^;]*//g' | \
    sed '/LOCALE =/d' | \
    sed 's/WITH TEMPLATE = template0 ENCODING = '\''UTF8'\''[^;]*/WITH TEMPLATE = template0 ENCODING = '\''UTF8'\''/g' \
    > "${FIXED_FILE}"

echo "Fixed backup saved to: ${FIXED_FILE}"
echo "Now restoring to PostgreSQL..."

# Set password if not already set
export PGPASSWORD=${DB_PASSWORD:-"12346789"}

# Restore the fixed backup
psql -U postgres -d postgres -h localhost < "${FIXED_FILE}"

echo "Restore completed successfully!"

# Cleanup
rm -f "${FIXED_FILE}"

echo "Verifying restore..."
psql -U postgres -d house_design -h localhost -c "\dt"