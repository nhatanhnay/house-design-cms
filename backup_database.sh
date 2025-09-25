#!/bin/bash

# Database backup script for house-design-cms
# This script creates a complete backup of your PostgreSQL database

# Set backup directory
BACKUP_DIR="./database_backup"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="house_design_schema_${DATE}.sql"

# Database connection details (adjust these to match your VPS settings)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-house_design}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database schema backup (structure only)..."
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo "Backup file: $BACKUP_DIR/$BACKUP_FILE"
echo ""

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
    echo "✅ Database schema backup completed successfully!"
    echo "📁 Backup saved to: $BACKUP_DIR/$BACKUP_FILE"
    echo "📊 File size: $(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)"

    # Create a restore script
    cat > "$BACKUP_DIR/restore_${DATE}.sh" << EOF
#!/bin/bash
# Restore script for backup created on $(date)

# Database connection details
DB_HOST=\${DB_HOST:-localhost}
DB_PORT=\${DB_PORT:-5432}
DB_USER=\${DB_USER:-postgres}
DB_NAME=\${DB_NAME:-house_design}

echo "Restoring database from backup..."
echo "⚠️  WARNING: This will DROP the existing database and recreate it!"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ \$REPLY =~ ^[Yy]\$ ]]; then
    psql -h "\$DB_HOST" -p "\$DB_PORT" -U "\$DB_USER" -d postgres < "$BACKUP_FILE"
    echo "✅ Database restored successfully!"
else
    echo "❌ Restore cancelled."
fi
EOF

    chmod +x "$BACKUP_DIR/restore_${DATE}.sh"
    echo "🔧 Restore script created: $BACKUP_DIR/restore_${DATE}.sh"

else
    echo ""
    echo "❌ Database backup failed!"
    exit 1
fi