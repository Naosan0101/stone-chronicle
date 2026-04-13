#!/usr/bin/env bash
# VPS に SSH したあと実行: bash diagnose-on-server.sh
set -euo pipefail
echo "=== nine-universe サービス ==="
systemctl is-active nine-universe 2>/dev/null || true
systemctl status nine-universe --no-pager -l 2>/dev/null | head -45 || echo "(ユニットがありません。install-service.sh を実行済みか確認)"
echo ""
echo "=== 8080 で待ち受けているか ==="
ss -tlnp 2>/dev/null | grep ':8080' || echo "(8080 で LISTEN していません)"
echo ""
echo "=== このマシン自身から /login へ ==="
curl -sI -m 5 http://127.0.0.1:8080/login 2>&1 | head -8 || echo "(curl 失敗)"
echo ""
echo "=== 直近ログ ==="
journalctl -u nine-universe -n 40 --no-pager 2>/dev/null || true
echo ""
echo "=== UFW ==="
sudo ufw status 2>/dev/null || echo "(ufw なし)"
echo ""
echo "=== Nginx ==="
systemctl is-active nginx 2>/dev/null || true
curl -sI -m 5 http://127.0.0.1/login 2>&1 | head -5 || true
echo ""
echo "=== 443 TLS（証明書取得後） ==="
ss -tlnp 2>/dev/null | grep ':443' || echo "(443 で LISTEN していません。certbot 前は正常)"
