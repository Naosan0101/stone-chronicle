#!/usr/bin/env bash
# VPS (Ubuntu) 上で実行: JDK 21 + PostgreSQL + DB ユーザー作成
# 事前: export STONE_DB_PASSWORD='英数字中心の強いパスワード'
set -euo pipefail

if [[ -z "${STONE_DB_PASSWORD:-}" ]]; then
	echo "エラー: 先に STONE_DB_PASSWORD を設定してください。" >&2
	echo "  export STONE_DB_PASSWORD='あなたのパスワード'" >&2
	exit 1
fi

export DEBIAN_FRONTEND=noninteractive
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y openjdk-21-jre-headless postgresql postgresql-client curl unzip

DB_NAME="${STONE_DB_NAME:-springdb}"
DB_USER="${STONE_DB_USER:-springuser}"

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
	EP="$(printf '%s' "${STONE_DB_PASSWORD}" | sed "s/'/''/g")"
	sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE USER \"${DB_USER}\" WITH PASSWORD '${EP}';"
fi

sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
	|| sudo -u postgres psql -c "CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_USER}\";"

sudo -u postgres psql -d "${DB_NAME}" -c "GRANT ALL ON SCHEMA public TO \"${DB_USER}\";"
sudo -u postgres psql -d "${DB_NAME}" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO \"${DB_USER}\";"

echo "OK: PostgreSQL と DB (${DB_NAME} / ${DB_USER}) を用意しました。"
echo "次: /etc/stone-chronicle.env を作成し、install-service.sh を実行してください。"
