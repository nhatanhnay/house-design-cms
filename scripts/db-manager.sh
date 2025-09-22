#!/bin/bash

# Database Management Script for VPS
# Usage: ./db-manager.sh [command] [options]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_DIR}/backups"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_debug() { echo -e "${BLUE}[DEBUG]${NC} $1"; }

show_help() {
    echo "Database Management Script for House Design CMS"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  backup                    Create database backup"
    echo "  restore <backup_file>     Restore database from backup"
    echo "  migrate                   Run database migrations"
    echo "  reset                     Reset database (WARNING: destroys all data)"
    echo "  status                    Show database status"
    echo "  shell                     Open PostgreSQL shell"
    echo "  logs                      Show database logs"
    echo ""
    echo "Examples:"
    echo "  $0 backup"
    echo "  $0 restore backups/database_20240922_120000.sql"
    echo "  $0 migrate"
    echo "  $0 status"
}

check_docker() {
    if ! docker-compose -f "${PROJECT_DIR}/docker-compose.prod.yml" ps postgres | grep -q "Up"; then
        log_error "PostgreSQL container is not running"
        log_info "Start with: docker-compose -f docker-compose.prod.yml up -d postgres"
        exit 1
    fi
}

backup_database() {
    log_info "Creating database backup..."
    
    mkdir -p "${BACKUP_DIR}"
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="${BACKUP_DIR}/database_${TIMESTAMP}.sql"
    
    docker-compose -f "${PROJECT_DIR}/docker-compose.prod.yml" exec -T postgres \
        pg_dump -U postgres -d house_design --clean --if-exists > "${BACKUP_FILE}"
    
    gzip "${BACKUP_FILE}"
    
    log_info "Backup created: ${BACKUP_FILE}.gz"
    
    # Cleanup old backups (keep 30 days)
    find "${BACKUP_DIR}" -name "database_*.sql.gz" -mtime +30 -delete
    
    # Show backup size
    ls -lh "${BACKUP_FILE}.gz" | awk '{print "Backup size:", $5}'
}

restore_database() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        log_error "Please specify backup file"
        echo "Available backups:"
        ls -la "${BACKUP_DIR}"/database_*.sql* 2>/dev/null || echo "No backups found"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_warn "This will DESTROY all current data in the database!"
    read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    log_info "Restoring database from: $backup_file"
    
    # Check if file is compressed
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | docker-compose -f "${PROJECT_DIR}/docker-compose.prod.yml" exec -T postgres \
            psql -U postgres -d postgres
    else
        docker-compose -f "${PROJECT_DIR}/docker-compose.prod.yml" exec -T postgres \
            psql -U postgres -d postgres < "$backup_file"
    fi
    
    log_info "Database restored successfully"
}

run_migrations() {
    log_info "Running database migrations..."
    
    MIGRATION_DIR="${PROJECT_DIR}/database/migrations"
    
    if [ ! -d "$MIGRATION_DIR" ]; then
        log_error "Migration directory not found: $MIGRATION_DIR"
        exit 1
    fi
    
    for migration in "${MIGRATION_DIR}"/*.sql; do
        if [ -f "$migration" ]; then
            log_info "Running migration: $(basename "$migration")"
            docker-compose -f "${PROJECT_DIR}/docker-compose.prod.yml" exec -T postgres \
                psql -U postgres -d house_design -f "/docker-entrypoint-initdb.d/$(basename "$migration")"
        fi
    done
    
    log_info "Migrations completed"
}

reset_database() {
    log_warn "This will DESTROY ALL DATA in the database!"
    log_warn "This action cannot be undone!"
    echo
    read -p "Type 'RESET' to confirm: " confirm
    
    if [ "$confirm" != "RESET" ]; then
        log_info "Reset cancelled"
        exit 0
    fi
    
    log_info "Resetting database..."
    
    # Stop containers
    docker-compose -f "${PROJECT_DIR}/docker-compose.prod.yml" down
    
    # Remove database volume
    docker volume rm house-design-cms_postgres_data 2>/dev/null || true
    
    # Start containers
    docker-compose -f "${PROJECT_DIR}/docker-compose.prod.yml" up -d postgres
    
    # Wait for PostgreSQL to be ready
    log_info "Waiting for PostgreSQL to be ready..."
    sleep 10
    
    # Run migrations
    run_migrations
    
    log_info "Database reset completed"
}

show_status() {
    log_info "Database Status"
    echo "=============="
    
    # Container status
    echo "Container Status:"
    docker-compose -f "${PROJECT_DIR}/docker-compose.prod.yml" ps postgres
    echo
    
    # Database info
    echo "Database Info:"
    docker-compose -f "${PROJECT_DIR}/docker-compose.prod.yml" exec postgres \
        psql -U postgres -d house_design -c "\l+ house_design"
    echo
    
    # Table info
    echo "Tables:"
    docker-compose -f "${PROJECT_DIR}/docker-compose.prod.yml" exec postgres \
        psql -U postgres -d house_design -c "\dt"
    echo
    
    # Recent backups
    echo "Recent Backups:"
    ls -la "${BACKUP_DIR}"/database_*.sql* 2>/dev/null | tail -5 || echo "No backups found"
}

open_shell() {
    log_info "Opening PostgreSQL shell..."
    docker-compose -f "${PROJECT_DIR}/docker-compose.prod.yml" exec postgres \
        psql -U postgres -d house_design
}

show_logs() {
    log_info "Showing database logs..."
    docker-compose -f "${PROJECT_DIR}/docker-compose.prod.yml" logs -f postgres
}

# Main script logic
case "$1" in
    backup)
        check_docker
        backup_database
        ;;
    restore)
        check_docker
        restore_database "$2"
        ;;
    migrate)
        check_docker
        run_migrations
        ;;
    reset)
        reset_database
        ;;
    status)
        check_docker
        show_status
        ;;
    shell)
        check_docker
        open_shell
        ;;
    logs)
        check_docker
        show_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        echo
        show_help
        exit 1
        ;;
esac