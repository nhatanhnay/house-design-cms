#!/bin/bash

# Database backup script for house-design-cms
# This script creates a full backup of database structure and data

# Set backup directory
BACKUP_DIR="./database_backup"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="house_design_full_backup_${DATE}.sql"

# Database connection details
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-house_design}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "📦 Database Backup"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

echo "📁 Creating full backup (structure + data)..."
echo "Backup file: $BACKUP_DIR/$BACKUP_FILE"

# Create full dump (structure AND data)
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
    --verbose \
    --clean \
    --create \
    --if-exists \
    --format=plain \
    --encoding=UTF8 \
    "$DB_NAME" > "$BACKUP_DIR/$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Full database backup completed successfully!"
    echo "📁 Backup saved to: $BACKUP_DIR/$BACKUP_FILE"
    echo "📊 File size: $(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)"

    # Backup uploaded files
    echo ""
    echo "📁 Backing up uploaded files..."
    UPLOADS_DIR="./backend/data/uploads"
    UPLOADS_BACKUP="$BACKUP_DIR/uploads_backup_${DATE}.tar.gz"

    if [ -d "$UPLOADS_DIR" ]; then
        tar -czf "$UPLOADS_BACKUP" -C "./backend/data" uploads
        echo "✅ Uploaded files backed up successfully!"
        echo "📁 Uploads backup: $UPLOADS_BACKUP"
        echo "📊 File size: $(du -h "$UPLOADS_BACKUP" | cut -f1)"
        echo "📊 Total files: $(find "$UPLOADS_DIR" -type f | wc -l)"
    else
        echo "⚠️  Warning: Uploads directory not found at $UPLOADS_DIR"
    fi

    # Create VPS restore script
    cat > "$BACKUP_DIR/vps_restore_${DATE}.sh" << EOF
#!/bin/bash
# VPS Database Restore Script
# This script restores the full database backup to VPS

# Database connection details for VPS
DB_HOST=\${DB_HOST:-localhost}
DB_PORT=\${DB_PORT:-5432}
DB_USER=\${DB_USER:-postgres}
DB_NAME=\${DB_NAME:-house_design}

echo "⚠️  WARNING: This will REPLACE ALL DATA in VPS database!"
echo "Database: \$DB_NAME"
echo "Host: \$DB_HOST:\$DB_PORT"
echo "User: \$DB_USER"
echo ""
read -p "Are you sure you want to continue? (type 'RESTORE' to confirm): " -r
echo

if [[ \$REPLY != "RESTORE" ]]; then
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
echo "📁 Step 2: Restoring full backup to VPS database..."

# Restore the full backup (ignore role errors)
psql -h "\$DB_HOST" -p "\$DB_PORT" -U "\$DB_USER" -d "\$DB_NAME" < "$BACKUP_FILE" 2>&1 | grep -v "role.*does not exist"

if [ \$? -eq 0 ]; then
    echo "✅ Full backup restored to VPS successfully!"

    # Count restored data
    echo ""
    echo "📊 Database statistics:"
    psql -h "\$DB_HOST" -p "\$DB_PORT" -U "\$DB_USER" -d "\$DB_NAME" << SQL
SELECT 'Categories: ' || COUNT(*) FROM categories;
SELECT 'Posts: ' || COUNT(*) FROM posts;
SELECT 'Products: ' || COUNT(*) FROM products;
SELECT 'Product Images: ' || COUNT(*) FROM product_images;
SQL

    # Restore uploaded files
    echo ""
    echo "📁 Step 3: Restoring uploaded files..."
    UPLOADS_BACKUP="uploads_backup_${DATE}.tar.gz"

    if [ -f "\$UPLOADS_BACKUP" ]; then
        # Create backend/data directory if it doesn't exist
        mkdir -p ./backend/data

        # Extract uploads
        tar -xzf "\$UPLOADS_BACKUP" -C ./backend/data

        if [ \$? -eq 0 ]; then
            echo "✅ Uploaded files restored successfully!"
            echo "📊 Total files: \$(find ./backend/data/uploads -type f 2>/dev/null | wc -l)"
        else
            echo "⚠️  Warning: Failed to restore uploaded files"
        fi
    else
        echo "⚠️  Warning: Uploads backup file not found: \$UPLOADS_BACKUP"
        echo "You may need to manually transfer the uploads directory"
    fi
else
    echo "❌ Failed to restore backup to VPS!"
    exit 1
fi
EOF

    chmod +x "$BACKUP_DIR/vps_restore_${DATE}.sh"
    echo "🔧 VPS restore script created: $BACKUP_DIR/vps_restore_${DATE}.sh"

    # Show backup statistics
    echo ""
    echo "📊 Backup statistics:"
    echo "Categories: $(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM categories;")"
    echo "Posts: $(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM posts;")"
    echo "Products: $(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM products;")"
    echo "Product Images: $(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM product_images;")"

else
    echo ""
    echo "❌ Database backup failed!"
    exit 1
fi