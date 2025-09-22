#!/bin/bash

# VPS Deployment Setup Script
# Run this script on your VPS to set up the House Design CMS

set -e

echo "=== House Design CMS - VPS Deployment Setup ==="
echo ""

# Configuration
PROJECT_NAME="house-design-cms"
PROJECT_DIR="/opt/${PROJECT_NAME}"
BACKUP_DIR="${PROJECT_DIR}/backups"
LOG_DIR="${PROJECT_DIR}/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run this script as root (use sudo)"
    exit 1
fi

log_info "Starting VPS deployment setup..."

# Update system packages
log_info "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
log_info "Installing required packages..."
apt install -y \
    docker.io \
    docker-compose \
    postgresql-client \
    nginx \
    certbot \
    python3-certbot-nginx \
    curl \
    wget \
    git \
    htop \
    ufw

# Start and enable Docker
log_info "Setting up Docker..."
systemctl start docker
systemctl enable docker
usermod -aG docker $SUDO_USER 2>/dev/null || true

# Create project directory
log_info "Creating project directory at ${PROJECT_DIR}..."
mkdir -p "${PROJECT_DIR}"
mkdir -p "${BACKUP_DIR}"
mkdir -p "${LOG_DIR}"
mkdir -p "${PROJECT_DIR}/nginx"
mkdir -p "${PROJECT_DIR}/database/migrations"

# Set up firewall
log_info "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5432/tcp  # PostgreSQL (restrict this in production)

# Create nginx configuration
log_info "Creating nginx configuration..."
cat > "${PROJECT_DIR}/nginx/nginx.conf" << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8080;
    }

    upstream frontend {
        server frontend:80;
    }

    server {
        listen 80;
        server_name _;

        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
EOF

# Create deployment script
log_info "Creating deployment script..."
cat > "${PROJECT_DIR}/deploy.sh" << 'EOF'
#!/bin/bash

set -e

PROJECT_DIR="/opt/house-design-cms"
cd "${PROJECT_DIR}"

echo "=== Deploying House Design CMS ==="

# Pull latest changes
if [ -d ".git" ]; then
    git pull origin main
else
    echo "Not a git repository, skipping git pull"
fi

# Build and start containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

echo "Deployment complete!"
echo "Frontend: http://$(curl -s ifconfig.me)"
echo "Backend API: http://$(curl -s ifconfig.me):8080/api"

# Show container status
docker-compose -f docker-compose.prod.yml ps
EOF

chmod +x "${PROJECT_DIR}/deploy.sh"

# Create backup script
log_info "Creating backup script..."
cat > "${PROJECT_DIR}/backup.sh" << 'EOF'
#!/bin/bash

set -e

PROJECT_DIR="/opt/house-design-cms"
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

cd "${PROJECT_DIR}"

echo "=== Creating backup at ${TIMESTAMP} ==="

# Backup database
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres house_design > "${BACKUP_DIR}/database_${TIMESTAMP}.sql"

# Backup uploads
tar -czf "${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz" -C backend/data uploads/

# Cleanup old backups (keep last 30 days)
find "${BACKUP_DIR}" -name "*.sql" -mtime +30 -delete
find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_DIR}/database_${TIMESTAMP}.sql"
echo "Uploads backup: ${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz"
EOF

chmod +x "${PROJECT_DIR}/backup.sh"

# Set up cron for automated backups
log_info "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * ${PROJECT_DIR}/backup.sh >> ${LOG_DIR}/backup.log 2>&1") | crontab -

# Create SSL setup script
log_info "Creating SSL setup script..."
cat > "${PROJECT_DIR}/setup-ssl.sh" << 'EOF'
#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: $0 <domain_name>"
    echo "Example: $0 example.com"
    exit 1
fi

DOMAIN=$1

echo "Setting up SSL for domain: ${DOMAIN}"

# Get SSL certificate
certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --email admin@${DOMAIN}

# Set up auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer

echo "SSL setup complete for ${DOMAIN}"
EOF

chmod +x "${PROJECT_DIR}/setup-ssl.sh"

# Set ownership
chown -R $SUDO_USER:$SUDO_USER "${PROJECT_DIR}" 2>/dev/null || true

log_info "VPS setup completed successfully!"
echo ""
echo "=== Next Steps ==="
echo "1. Copy your project files to: ${PROJECT_DIR}"
echo "2. Copy .env.production to ${PROJECT_DIR}/.env and update values"
echo "3. Run: cd ${PROJECT_DIR} && ./deploy.sh"
echo "4. For SSL: ./setup-ssl.sh yourdomain.com"
echo ""
echo "=== Useful Commands ==="
echo "Deploy: ${PROJECT_DIR}/deploy.sh"
echo "Backup: ${PROJECT_DIR}/backup.sh"
echo "Logs: docker-compose -f ${PROJECT_DIR}/docker-compose.prod.yml logs -f"
echo "Status: docker-compose -f ${PROJECT_DIR}/docker-compose.prod.yml ps"
echo ""
log_info "Setup complete! Your VPS is ready for deployment."