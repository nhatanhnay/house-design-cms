# House Design CMS - VPS Deployment Guide

## Overview

Hướng dẫn này giúp bạn deploy House Design CMS lên VPS với PostgreSQL database được backup và cấu hình hoàn chỉnh.

## Cấu trúc files đã tạo

### Scripts

- `scripts/backup-database.sh` - Backup PostgreSQL database
- `scripts/restore-database.sh` - Restore database từ backup
- `scripts/setup-vps.sh` - Setup VPS từ đầu
- `scripts/db-manager.sh` - Quản lý database toàn diện

### Database

- `database/migrations/001_initial_schema.sql` - Schema database
- `database/migrations/002_seed_data.sql` - Dữ liệu mặc định

### Configuration

- `docker-compose.prod.yml` - Docker compose cho production
- `.env.production` - Environment variables mẫu

## Hướng dẫn deploy lên VPS

### Bước 1: Backup database hiện tại

```bash
# Chạy trên máy local
./scripts/backup-database.sh
```

### Bước 2: Setup VPS

```bash
# Chạy trên VPS với quyền root
curl -sSL https://raw.githubusercontent.com/your-repo/house-design-cms/main/scripts/setup-vps.sh | sudo bash
```

Hoặc copy script lên VPS và chạy:

```bash
sudo ./scripts/setup-vps.sh
```

### Bước 3: Copy project lên VPS

```bash
# Trên máy local
scp -r . user@your-vps-ip:/opt/house-design-cms/

# Hoặc dùng git
ssh user@your-vps-ip
cd /opt/house-design-cms
git clone https://github.com/your-repo/house-design-cms.git .
```

### Bước 4: Cấu hình environment

```bash
# Trên VPS
cd /opt/house-design-cms
cp .env.production .env
nano .env  # Chỉnh sửa các giá trị cần thiết
```

### Bước 5: Deploy application

```bash
# Trên VPS
./deploy.sh
```

### Bước 6: Restore database (nếu có data cũ)

```bash
# Copy backup file từ local lên VPS
scp backups/latest_backup.sql.gz user@your-vps-ip:/opt/house-design-cms/backups/

# Restore trên VPS
./scripts/db-manager.sh restore backups/latest_backup.sql.gz
```

## Quản lý Database trên VPS

### Backup database

```bash
./scripts/db-manager.sh backup
```

### Restore database

```bash
./scripts/db-manager.sh restore backups/database_20240922_120000.sql.gz
```

### Xem trạng thái database

```bash
./scripts/db-manager.sh status
```

### Chạy migrations

```bash
./scripts/db-manager.sh migrate
```

### Mở PostgreSQL shell

```bash
./scripts/db-manager.sh shell
```

### Reset database (cảnh báo: xóa tất cả data)

```bash
./scripts/db-manager.sh reset
```

## Automatic Backups

Hệ thống đã được cài đặt cron job để backup tự động hàng ngày lúc 2:00 AM:

```bash
# Xem cron jobs
crontab -l

# Chỉnh sửa thời gian backup
crontab -e
```

## SSL Setup

Để setup SSL cho domain:

```bash
./setup-ssl.sh yourdomain.com
```

## Monitoring

### Xem logs

```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f

# Database logs
./scripts/db-manager.sh logs

# Nginx logs (nếu dùng)
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Kiểm tra container status

```bash
docker-compose -f docker-compose.prod.yml ps
```

## Troubleshooting

### Container không start

```bash
# Xem logs chi tiết
docker-compose -f docker-compose.prod.yml logs [service_name]

# Restart service
docker-compose -f docker-compose.prod.yml restart [service_name]
```

### Database connection issues

```bash
# Test database connection
./scripts/db-manager.sh status

# Restart PostgreSQL
docker-compose -f docker-compose.prod.yml restart postgres
```

### Port conflicts

```bash
# Xem port đang sử dụng
netstat -tulpn | grep :8080
netstat -tulpn | grep :5432

# Kill process sử dụng port
sudo kill -9 <PID>
```

## Security Checklist

- [ ] Đổi password PostgreSQL mặc định
- [ ] Đổi password admin mặc định (admin/admin123)
- [ ] Cấu hình firewall chỉ mở port cần thiết
- [ ] Setup SSL certificate
- [ ] Định kỳ backup database
- [ ] Monitor logs thường xuyên
- [ ] Update container images định kỳ

## Maintenance Commands

### Update application

```bash
cd /opt/house-design-cms
git pull origin main
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Cleanup old Docker images

```bash
docker system prune -a
```

### Rotate logs

```bash
# Truncate large log files
truncate -s 0 /opt/house-design-cms/logs/*.log
```
