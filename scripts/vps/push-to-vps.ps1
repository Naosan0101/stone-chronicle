# リポジトリルートで実行: ビルド済み JAR と VPS 用スクリプトを Ubuntu にコピー
# 例: .\scripts\vps\push-to-vps.ps1 -SshHost 133.167.90.218 -SshUser ubuntu
param(
	[string] $SshHost = "",
	[string] $SshUser = "ubuntu"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $root

if (-not $SshHost) {
	Write-Host "使い方: .\scripts\vps\push-to-vps.ps1 -SshHost あなたのVPSのIP" -ForegroundColor Yellow
	exit 1
}

$jar = Get-ChildItem -Path (Join-Path $root "build\libs") -Filter "*-SNAPSHOT.jar" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $jar) {
	Write-Host "JAR がありません。先に .\gradlew.bat bootJar を実行してください。" -ForegroundColor Red
	exit 1
}

$remote = "${SshUser}@${SshHost}"
Write-Host "JAR: $($jar.Name) -> ${remote}:/tmp/nine-universe.jar"
scp $jar.FullName "${remote}:/tmp/nine-universe.jar"

$vpsDir = Join-Path $root "scripts\vps"
Write-Host "スクリプト -> ${remote}:~/nine-universe-vps/"
ssh $remote "mkdir -p ~/nine-universe-vps"
scp (Join-Path $vpsDir "setup-server.sh") "${remote}:~/nine-universe-vps/"
scp (Join-Path $vpsDir "install-service.sh") "${remote}:~/nine-universe-vps/"
scp (Join-Path $vpsDir "nine-universe.service") "${remote}:~/nine-universe-vps/"
scp (Join-Path $vpsDir "nine-universe.env.example") "${remote}:~/nine-universe-vps/"
scp (Join-Path $vpsDir "diagnose-on-server.sh") "${remote}:~/nine-universe-vps/"

Write-Host ""
Write-Host "完了。次を VPS 上で実行:" -ForegroundColor Green
Write-Host "  ssh $remote"
Write-Host "  chmod +x ~/nine-universe-vps/*.sh"
	Write-Host "  export NINE_UNIVERSE_DB_PASSWORD='（DB用パスワード）'"
Write-Host "  bash ~/nine-universe-vps/setup-server.sh"
Write-Host "  sudo mkdir -p /opt/nine-universe && sudo mv /tmp/nine-universe.jar /opt/nine-universe/"
Write-Host "  sudo cp ~/nine-universe-vps/nine-universe.env.example /etc/nine-universe.env"
Write-Host "  sudo nano /etc/nine-universe.env   # SPRING_DATASOURCE_PASSWORD を設定"
Write-Host "  sudo bash ~/nine-universe-vps/install-service.sh"
Write-Host ""
Write-Host "さくらパケットフィルタで TCP 8080（または 80/443）を許可してください。" -ForegroundColor Yellow
