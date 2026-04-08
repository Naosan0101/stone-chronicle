#!/usr/bin/env bash
# stone-chronicle.jar を /opt/stone-chronicle/ に置いたあと、root で実行
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
	echo "sudo で実行してください: sudo bash install-service.sh" >&2
	exit 1
fi

if [[ ! -f /opt/stone-chronicle/stone-chronicle.jar ]]; then
	echo "先に JAR を配置: /opt/stone-chronicle/stone-chronicle.jar" >&2
	exit 1
fi

if [[ ! -f /etc/stone-chronicle.env ]]; then
	echo "先に /etc/stone-chronicle.env を作成（stone-chronicle.env.example 参照）" >&2
	exit 1
fi

id stoneapp &>/dev/null || useradd -r -s /usr/sbin/nologin -d /opt/stone-chronicle stoneapp
mkdir -p /opt/stone-chronicle
chown stoneapp:stoneapp /opt/stone-chronicle/stone-chronicle.jar
chmod 640 /etc/stone-chronicle.env
chown root:stoneapp /etc/stone-chronicle.env

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
install -m 644 "${SCRIPT_DIR}/stone-chronicle.service" /etc/systemd/system/stone-chronicle.service

systemctl daemon-reload
systemctl enable stone-chronicle.service
systemctl restart stone-chronicle.service
systemctl --no-pager status stone-chronicle.service

echo "OK: systemctl status stone-chronicle で確認。ログ: journalctl -u stone-chronicle -f"
