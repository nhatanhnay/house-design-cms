#!/usr/bin/env bash
#
# Chạy TRÊN VPS, được GitHub Actions upload lên và gọi qua SSH.
# Deploy backend trước (có health check + tự rollback), rồi mới swap frontend.
#
# Usage: bash deploy-remote.sh <RELEASE_ID>
#
set -Eeuo pipefail

RELEASE_ID="${1:?thieu RELEASE_ID}"

STAGE_DIR="/tmp/hd-deploy-${RELEASE_ID}"
WEB_ROOT="/var/www/html"
RELEASES="${WEB_ROOT}/releases"
LIVE="${WEB_ROOT}/house-design-frontend"
BE_DIR="/root/house-design-cms/backend"
BE_BIN="${BE_DIR}/house-design-backend"
BE_BAK="${BE_DIR}/house-design-backend.bak"
SERVICE="house-design-backend"
HEALTH="http://127.0.0.1:8080/health"
PUBLIC_URL="https://mmadesign.vn"
KEEP_RELEASES=5

log() { printf '\n\033[1;34m>>> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mXXX %s\033[0m\n' "$*" >&2; exit 1; }

[ -f "${STAGE_DIR}/house-design-backend" ] || die "thieu binary trong ${STAGE_DIR}"
[ -d "${STAGE_DIR}/frontend" ]            || die "thieu frontend build trong ${STAGE_DIR}"
[ -n "$(ls -A "${STAGE_DIR}/frontend")" ] || die "frontend build rong"

# ---------------------------------------------------------------- backend ----
log "Deploy backend"
if [ -f "${BE_BIN}" ]; then
  cp -a "${BE_BIN}" "${BE_BAK}"
  echo "rollback point: ${BE_BAK}"
fi

# install -m 755: artifact cua GitHub Actions mat bit +x, nen set mode tuong minh
install -m 755 "${STAGE_DIR}/house-design-backend" "${BE_BIN}"
systemctl restart "${SERVICE}"

log "Health check backend"
healthy=0
for i in $(seq 1 15); do
  if curl -fsS --max-time 3 "${HEALTH}" >/dev/null 2>&1; then
    healthy=1
    echo "OK sau ${i} lan thu"
    break
  fi
  sleep 2
done

if [ "${healthy}" -ne 1 ]; then
  log "HEALTH CHECK FAIL -> rollback backend"
  journalctl -u "${SERVICE}" -n 40 --no-pager || true
  if [ -f "${BE_BAK}" ]; then
    install -m 755 "${BE_BAK}" "${BE_BIN}"
    systemctl restart "${SERVICE}"
    sleep 5
    if curl -fsS --max-time 5 "${HEALTH}" >/dev/null 2>&1; then
      die "Da rollback backend ve ban cu thanh cong. Deploy bi huy, frontend KHONG bi doi."
    fi
    die "ROLLBACK CUNG FAIL - backend dang chet, can vao server xu ly tay!"
  fi
  die "Khong co ban backup de rollback - backend dang chet!"
fi

# --------------------------------------------------------------- frontend ----
log "Deploy frontend release ${RELEASE_ID}"
mkdir -p "${RELEASES}"

# Lan dau chay: LIVE con la directory thuc -> chuyen thanh symlink
if [ -d "${LIVE}" ] && [ ! -L "${LIVE}" ]; then
  BACKUP_REL="${RELEASES}/pre-cicd-$(date +%Y%m%d-%H%M%S)"
  log "Lan dau: chuyen ${LIVE} tu directory sang symlink (backup: ${BACKUP_REL})"
  mv "${LIVE}" "${BACKUP_REL}"
  ln -sfn "${BACKUP_REL}" "${LIVE}"
fi

NEW_REL="${RELEASES}/${RELEASE_ID}"
rm -rf "${NEW_REL}"
mkdir -p "${NEW_REL}"
cp -a "${STAGE_DIR}/frontend/." "${NEW_REL}/"

chown -R www-data:www-data "${NEW_REL}"
find "${NEW_REL}" -type d -exec chmod 755 {} +
find "${NEW_REL}" -type f -exec chmod 644 {} +

PREV_TARGET="$(readlink -f "${LIVE}" 2>/dev/null || true)"

# Swap nguyen tu: tao symlink tam roi mv -T de doi cho, khong co khoang trong 404
ln -sfn "${NEW_REL}" "${WEB_ROOT}/.hdf-staging"
mv -Tf "${WEB_ROOT}/.hdf-staging" "${LIVE}"
echo "live -> $(readlink -f "${LIVE}")"

# ----------------------------------------------------------------- verify ----
log "Verify qua nginx"
verify_fail=0
curl -fsS -o /dev/null --max-time 10 "${PUBLIC_URL}/"           || verify_fail=1
curl -fsS -o /dev/null --max-time 10 "${PUBLIC_URL}/api/posts"  || verify_fail=1

if [ "${verify_fail}" -ne 0 ]; then
  log "VERIFY FAIL -> tra frontend ve ban truoc"
  if [ -n "${PREV_TARGET}" ] && [ -d "${PREV_TARGET}" ]; then
    ln -sfn "${PREV_TARGET}" "${WEB_ROOT}/.hdf-staging"
    mv -Tf "${WEB_ROOT}/.hdf-staging" "${LIVE}"
    die "Da rollback frontend ve ${PREV_TARGET}"
  fi
  die "Verify fail va khong co ban truoc de rollback"
fi

# ------------------------------------------------------------------ prune ----
log "Don release cu (giu ${KEEP_RELEASES} ban moi nhat)"
CURRENT="$(readlink -f "${LIVE}")"
cd "${RELEASES}"
# shellcheck disable=SC2012
ls -1dt */ 2>/dev/null | tail -n "+$((KEEP_RELEASES + 1))" | while read -r old; do
  old_abs="$(readlink -f "${old}")"
  [ "${old_abs}" = "${CURRENT}" ] && continue   # tuyet doi khong xoa ban dang live
  echo "xoa ${old}"
  rm -rf "${old}"
done

rm -rf "${STAGE_DIR}"

log "DEPLOY OK: ${RELEASE_ID}"
echo "  backend : $(systemctl is-active ${SERVICE})"
echo "  frontend: $(readlink -f "${LIVE}")"
echo "  rollback binary con giu tai: ${BE_BAK}"
