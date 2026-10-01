#!/usr/bin/env bash
# Stop-hook helper: commit + push, deploy lên Cloudflare Pages, rồi POLL trạng thái
# thực tế của deployment trên edge Cloudflare — chỉ báo ✅ khi deployment đã live.
# Stdout cuối cùng là 1 dòng JSON {"systemMessage": "..."} cho Claude Code hiển thị.
set -o pipefail
cd "$(dirname "$0")/.." || exit 0

PROJECT="so-tay-hoc-tap"
PROD="https://${PROJECT}.pages.dev"

say() { printf '{"systemMessage":"%s"}\n' "$1"; }

# Không có thay đổi → im lặng.
[ -z "$(git status --porcelain)" ] && exit 0

git add -A || { say "⚠️ git add thất bại"; exit 0; }
git commit -q -m "chore: auto-sync $(date +%F_%T)" || { say "⚠️ git commit thất bại"; exit 0; }
git push -q origin main || { say "⚠️ Đã commit nhưng git push thất bại"; exit 0; }

# wrangler pages deploy chạy build + upload + tạo deployment, block tới khi trả về.
log=$(npm run deploy 2>&1)
if [ $? -ne 0 ]; then
  say "❌ Deploy thất bại (build hoặc wrangler lỗi) — đã commit+push, site chưa cập nhật"
  exit 0
fi

# URL deployment vừa tạo (subdomain hash) in ra bởi wrangler; fallback về production.
url=$(printf '%s\n' "$log" | grep -oE "https://[a-z0-9]+\.${PROJECT//./\\.}\.pages\.dev" | tail -1)
target=${url:-$PROD}

# POLL Cloudflare edge: deployment coi là hoàn tất khi URL của nó trả HTTP 200.
poll() {
  local u=$1 i code
  for i in $(seq 1 40); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$u")
    [ "$code" = "200" ] && return 0
    sleep 3
  done
  return 1
}

if poll "$target"; then
  poll "$PROD"   # đợi alias production cập nhật nốt (không chặn kết quả)
  say "✅ Deploy thành công & đã live trên Cloudflare: ${PROD}"
else
  say "⚠️ Deploy đã đẩy nhưng poll ${target} chưa trả 200 sau ~2 phút — kiểm tra Cloudflare dashboard"
fi
exit 0
