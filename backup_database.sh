#!/bin/bash

# Database management script for house-design-cms
# This script clears all data, then creates a clean structure backup

# Set backup directory
BACKUP_DIR="./database_backup"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="house_design_clean_schema_${DATE}.sql"

# Database connection details
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-house_design}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "⚠️  WARNING: This will DELETE ALL DATA from the database!"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""
read -p "Are you sure you want to continue? (type 'DELETE ALL' to confirm): " -r
echo

if [[ $REPLY != "DELETE ALL" ]]; then
    echo "❌ Operation cancelled."
    exit 1
fi

echo "🗑️  Step 1: Clearing all data from database..."

# Clear all data from tables
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
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

-- Reset sequences to start from 1
ALTER SEQUENCE admin_id_seq RESTART WITH 1;
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE articles_id_seq RESTART WITH 1;
ALTER SEQUENCE posts_id_seq RESTART WITH 1;
ALTER SEQUENCE home_content_id_seq RESTART WITH 1;
EOF

if [ $? -eq 0 ]; then
    echo "✅ All data cleared successfully!"
else
    echo "❌ Failed to clear data!"
    exit 1
fi

echo ""
echo "📁 Step 2: Creating clean structure backup..."
echo "Backup file: $BACKUP_DIR/$BACKUP_FILE"

# Create schema-only dump (structure without data)
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
    --verbose \
    --clean \
    --create \
    --if-exists \
    --schema-only \
    --format=plain \
    --encoding=UTF8 \
    "$DB_NAME" > "$BACKUP_DIR/$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Clean database schema backup completed successfully!"
    echo "📁 Backup saved to: $BACKUP_DIR/$BACKUP_FILE"
    echo "📊 File size: $(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)"

    # Create VPS database reset and reload script
    cat > "$BACKUP_DIR/vps_reset_and_reload_${DATE}.sh" << EOF
#!/bin/bash
# VPS Database Reset and Reload Script
# This script clears the VPS database and loads the clean structure

# Database connection details for VPS
DB_HOST=\${DB_HOST:-localhost}
DB_PORT=\${DB_PORT:-5432}
DB_USER=\${DB_USER:-postgres}
DB_NAME=\${DB_NAME:-house_design}

echo "⚠️  WARNING: This will DELETE ALL DATA from VPS database and reload structure!"
echo "Database: \$DB_NAME"
echo "Host: \$DB_HOST:\$DB_PORT"
echo "User: \$DB_USER"
echo ""
read -p "Are you sure you want to continue? (type 'RESET VPS' to confirm): " -r
echo

if [[ \$REPLY != "RESET VPS" ]]; then
    echo "❌ Operation cancelled."
    exit 1
fi

echo "🗑️  Step 1: Dropping and recreating VPS database..."

# Drop and recreate database to avoid constraint conflicts
psql -h "\$DB_HOST" -p "\$DB_PORT" -U "\$DB_USER" -d postgres << SQL
-- Terminate all connections to the database
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '\$DB_NAME';

-- Drop and recreate database
DROP DATABASE IF EXISTS "\$DB_NAME";
CREATE DATABASE "\$DB_NAME";
SQL

if [ \$? -eq 0 ]; then
    echo "✅ VPS database recreated successfully!"
else
    echo "❌ Failed to recreate VPS database!"
    exit 1
fi

echo ""
echo "📁 Step 2: Loading clean structure to VPS database..."

# Load the clean structure (ignore role errors)
psql -h "\$DB_HOST" -p "\$DB_PORT" -U "\$DB_USER" -d "\$DB_NAME" < "$BACKUP_FILE" 2>&1 | grep -v "role.*does not exist"

if [ \$? -eq 0 ]; then
    echo "✅ Clean structure loaded to VPS successfully!"
else
    echo "❌ Failed to load structure to VPS!"
    exit 1
fi
EOF

    chmod +x "$BACKUP_DIR/vps_reset_and_reload_${DATE}.sh"
    echo "🔧 VPS reset script created: $BACKUP_DIR/vps_reset_and_reload_${DATE}.sh"

else
    echo ""
    echo "❌ Database backup failed!"
    exit 1
fi