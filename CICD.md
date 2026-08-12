# CI/CD — Build & Deploy

> ⚠️ `VPS-DEPLOYMENT.md` đã lỗi thời (mô tả setup Docker ở `/opt/house-design-cms` không tồn tại).
> File này mô tả hạ tầng **thực tế đang chạy**.

## Hạ tầng thật

| Thành phần | Thực tế |
|---|---|
| VPS | Ubuntu 22.04 — `157.66.26.139` — domain `mmadesign.vn` |
| Backend | Binary Go/Gin, systemd service `house-design-backend`, listen `:8080` |
| Backend path | `/root/house-design-cms/backend/house-design-backend` |
| Frontend | Angular 17 static, nginx serve từ `/var/www/html/house-design-frontend` (symlink) |
| Database | PostgreSQL 15, database `house_design` |
| Reverse proxy | nginx — `/etc/nginx/sites-available/mmadesign`, proxy `/api/` → `127.0.0.1:8080` |
| Docker | **Không dùng** |

## Luồng CI/CD

`.github/workflows/deploy.yml` — chạy khi push `main`, khi mở PR (chỉ build), hoặc bấm **Run workflow**.

```
job build (ubuntu-latest)
  go vet ./...
  go build CGO_ENABLED=0 GOOS=linux GOARCH=amd64  -> binary static
  npm ci && npm run build (production)
  upload artifact: binary + dist + deploy-remote.sh

job deploy  (bỏ qua nếu là pull_request)
  rsync artifact -> /tmp/hd-deploy-<sha>-<run>
  bash deploy-remote.sh:
    1. backup binary hiện tại -> .bak
    2. thay binary + systemctl restart
    3. health check /health (15 lần × 2s)
       └─ FAIL -> rollback binary cũ + restart, HỦY deploy, frontend không bị đổi
    4. copy frontend -> /var/www/html/releases/<sha>-<run>
    5. atomic swap symlink house-design-frontend -> release mới
    6. verify / và /api/posts qua nginx
       └─ FAIL -> trỏ symlink về release trước
    7. prune, giữ 5 release gần nhất
  smoke test 5 endpoint từ ngoài internet
```

Build trên GitHub runner, **không build trên VPS** — VPS chỉ có 3.8GB RAM và không có swap, build Angular rất dễ OOM.

`concurrency: production-deploy` đảm bảo không bao giờ có 2 deploy chạy song song.

## GitHub Secrets cần có

Settings → Secrets and variables → Actions → New repository secret:

| Secret | Giá trị |
|---|---|
| `VPS_HOST` | `157.66.26.139` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | Toàn bộ private key (kể cả dòng `BEGIN`/`END`) của keypair deploy |

Keypair deploy tạo bằng:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/house_design_deploy -N "" -C "github-actions-deploy@house-design-cms"
ssh-copy-id -i ~/.ssh/house_design_deploy.pub root@157.66.26.139
```

## Rollback tay

```bash
ssh root@157.66.26.139

# Backend: về bản trước
install -m 755 /root/house-design-cms/backend/house-design-backend.bak \
               /root/house-design-cms/backend/house-design-backend
systemctl restart house-design-backend

# Frontend: xem các bản có sẵn rồi trỏ symlink về
ls -1t /var/www/html/releases/
ln -sfn /var/www/html/releases/<release_id> /var/www/html/.hdf-staging
mv -Tf /var/www/html/.hdf-staging /var/www/html/house-design-frontend
```

Cách nhanh nhất: vào Actions, chọn run tốt trước đó, bấm **Re-run jobs**.

## Lệnh vận hành

```bash
systemctl status house-design-backend
systemctl restart house-design-backend
journalctl -u house-design-backend -f          # xem log realtime
curl http://127.0.0.1:8080/health
readlink -f /var/www/html/house-design-frontend # đang live release nào
```

## Nợ kỹ thuật cần xử lý

Repo đang **public**, nên các mục dưới đây đang lộ công khai:

- [ ] `backend/middleware/auth.go:12` hardcode JWT secret `"your-secret-key-change-in-production"` — biến env `JWT_SECRET` **không được đọc**, phải sửa code mới đổi được
- [ ] `backend/database/` hardcode password PostgreSQL làm giá trị fallback
- [ ] Backend bind `0.0.0.0:8080` + `ufw` inactive → API gọi trực tiếp được, bỏ qua HTTPS
- [ ] sshd còn `PasswordAuthentication yes` + `PermitRootLogin yes` → nên tắt password auth sau khi đã có SSH key
- [ ] Gin chưa `SetTrustedProxies` → `X-Forwarded-For` giả mạo được, ảnh hưởng số liệu bảng `visitors`
