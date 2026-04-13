#!/usr/bin/env bash
# Nginx リバースプロキシ + Let's Encrypt（certbot）
# 事前条件:
#   - nine-universe サービスが 127.0.0.1:8080 で動いていること
#   - DNS でドメインの A レコードがこの VPS のグローバル IP を向いていること（反映に数分〜）
#   - さくらのパケットフィルタで TCP 80 / 443 を許可していること
#
# 使い方（VPS で）:
#   export DOMAIN=nine-universe.jp
#   export CERTBOT_EMAIL=あなたのメール@example.com   # 任意（付けるなら下は sudo -E）
#   sudo -E bash ~/nine-universe-vps/setup-web-nginx.sh
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
	echo "sudo で実行してください: sudo bash $0" >&2
	exit 1
fi

DOMAIN="${DOMAIN:-nine-universe.jp}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CFG_SRC="${SCRIPT_DIR}/nginx-site.conf"

if [[ ! -f "${CFG_SRC}" ]]; then
	echo "見つかりません: ${CFG_SRC}" >&2
	echo "push-to-vps.ps1 で nine-universe-vps に nginx-site.conf をコピーしたか確認してください。" >&2
	exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

install -m 644 "${CFG_SRC}" /etc/nginx/sites-available/nine-universe
ln -sf /etc/nginx/sites-available/nine-universe /etc/nginx/sites-enabled/nine-universe
if [[ -f /etc/nginx/sites-enabled/default ]]; then
	rm -f /etc/nginx/sites-enabled/default
fi

nginx -t
systemctl enable nginx
systemctl reload nginx

echo "HTTP で Nginx を有効にしました。次に証明書を取得します（ドメイン: ${DOMAIN}）。"
CERTBOT_COMMON=(--nginx -d "${DOMAIN}" -d "www.${DOMAIN}")
if [[ -n "${CERTBOT_EMAIL:-}" ]]; then
	certbot "${CERTBOT_COMMON[@]}" --non-interactive --agree-tos -m "${CERTBOT_EMAIL}" --redirect
else
	echo "対話モード: メールアドレスと利用規約に同意するよう求められます。"
	certbot "${CERTBOT_COMMON[@]}" --redirect
fi

systemctl reload nginx
echo "OK: https://${DOMAIN}/ でアクセスできるはずです。"
echo "証明書の自動更新: systemctl status certbot.timer"
