#!/usr/bin/env bash
# nine-universe.jar を /opt/nine-universe/ に置いたあと、root で実行
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
	echo "sudo で実行してください: sudo bash install-service.sh" >&2
	exit 1
fi

if [[ ! -f /opt/nine-universe/nine-universe.jar ]]; then
	echo "先に JAR を配置: /opt/nine-universe/nine-universe.jar" >&2
	exit 1
fi

if [[ ! -f /etc/nine-universe.env ]]; then
	echo "先に /etc/nine-universe.env を作成（nine-universe.env.example 参照）" >&2
	exit 1
fi

id nineuniverseapp &>/dev/null || useradd -r -s /usr/sbin/nologin -d /opt/nine-universe nineuniverseapp
mkdir -p /opt/nine-universe
chown nineuniverseapp:nineuniverseapp /opt/nine-universe/nine-universe.jar
chmod 640 /etc/nine-universe.env
chown root:nineuniverseapp /etc/nine-universe.env

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
install -m 644 "${SCRIPT_DIR}/nine-universe.service" /etc/systemd/system/nine-universe.service

systemctl daemon-reload
systemctl enable nine-universe.service
systemctl restart nine-universe.service
systemctl --no-pager status nine-universe.service

echo "OK: systemctl status nine-universe で確認。ログ: journalctl -u nine-universe -f"
