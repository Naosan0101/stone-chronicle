# さくらの VPS + nine-universe.jp で公開する

リポジトリに同梱のスクリプトで、**独自ドメイン**と **VPS のグローバル IP** を使って HTTPS 公開できます。

## 前提

- VPS（例: さくらの VPS）に **Ubuntu または Debian 系 OS**
- ドメイン **nine-universe.jp** の DNS をさくら（または別 DNS）で管理できる
- 手元の PC から VPS へ **SSH** と **scp** ができる

## 1. DNS を向ける

ドメインの DNS 設定で、次を追加します（さくらのドメイン管理画面の「DNSレコード設定」など）。

| ホスト名 | 種別 | 向き先 |
|---------|------|--------|
| `@`（ルート） | A | **VPS のグローバル IP** |
| `www` | A | **同じ IP**（または `@` への CNAME） |

反映まで数分〜最大 48 時間程度かかることがあります。次に進む前に、手元 PC で `ping nine-universe.jp` が VPS の IP を返すか確認すると安全です。

## 2. さくら VPS のパケットフィルタ

コントロールパネルの **パケットフィルタ** で、少なくとも次を許可します。

- **TCP 22**（SSH）
- **TCP 80**（HTTP・証明書取得用）
- **TCP 443**（HTTPS）

アプリは Nginx の内側で **127.0.0.1:8080** だけを使う想定のため、**8080 をインターネットに開ける必要はありません**。

## 3. JAR をビルドして VPS に送る（Windows 例）

リポジトリのルートで:

```powershell
.\gradlew.bat bootJar
.\scripts\vps\push-to-vps.ps1 -SshHost （VPSのIP） -SshUser （ubuntu など）
```

## 4. VPS 上で DB と Java を用意

SSH で VPS に入り:

```bash
export NINE_UNIVERSE_DB_PASSWORD='（強いパスワード）'
chmod +x ~/nine-universe-vps/*.sh
# Windows から scp したスクリプトが CRLF だと「set: pipefail」で失敗することがあります。そのときは一度:
sed -i 's/\r$//' ~/nine-universe-vps/*.sh
bash ~/nine-universe-vps/setup-server.sh
```

## 5. アプリの配置と systemd

```bash
sudo mkdir -p /opt/nine-universe
sudo mv /tmp/nine-universe.jar /opt/nine-universe/
sudo cp ~/nine-universe-vps/nine-universe.env.example /etc/nine-universe.env
sudo nano /etc/nine-universe.env
# SPRING_DATASOURCE_PASSWORD を setup-server で設定した DB パスワードと一致させる

sudo bash ~/nine-universe-vps/install-service.sh
```

## 6. Nginx + HTTPS（Let's Encrypt）

**DNS が VPS の IP を向いたあと**に実行します。

```bash
export DOMAIN=nine-universe.jp
export CERTBOT_EMAIL='あなたのメール@example.com'
# sudo は既定で環境変数を渡さないため -E が必要（付けないと certbot が対話でメールを聞く）
sudo -E bash ~/nine-universe-vps/setup-web-nginx.sh
```

対話で進めたい場合は `CERTBOT_EMAIL` を付けずに `sudo bash ~/nine-universe-vps/setup-web-nginx.sh` でも構いません。

## 7. 動作確認

- ブラウザで `https://nine-universe.jp/login` が開けること
- 問題があれば VPS 上で `bash ~/nine-universe-vps/diagnose-on-server.sh`

## 更新デプロイ（JAR 差し替え）

手元で `bootJar` したあと、`scp` で `/tmp/nine-universe.jar` に送り、VPS で:

```bash
sudo systemctl stop nine-universe
sudo mv /tmp/nine-universe.jar /opt/nine-universe/nine-universe.jar
sudo chown nineuniverseapp:nineuniverseapp /opt/nine-universe/nine-universe.jar
sudo systemctl start nine-universe
```
