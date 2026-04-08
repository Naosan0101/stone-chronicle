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
Write-Host "JAR: $($jar.Name) -> ${remote}:/tmp/stone-chronicle.jar"
scp $jar.FullName "${remote}:/tmp/stone-chronicle.jar"

$vpsDir = Join-Path $root "scripts\vps"
Write-Host "スクリプト -> ${remote}:~/stone-chronicle-vps/"
ssh $remote "mkdir -p ~/stone-chronicle-vps"
scp (Join-Path $vpsDir "setup-server.sh") "${remote}:~/stone-chronicle-vps/"
scp (Join-Path $vpsDir "install-service.sh") "${remote}:~/stone-chronicle-vps/"
scp (Join-Path $vpsDir "stone-chronicle.service") "${remote}:~/stone-chronicle-vps/"
scp (Join-Path $vpsDir "stone-chronicle.env.example") "${remote}:~/stone-chronicle-vps/"
scp (Join-Path $vpsDir "diagnose-on-server.sh") "${remote}:~/stone-chronicle-vps/"

Write-Host ""
Write-Host "完了。次を VPS 上で実行:" -ForegroundColor Green
Write-Host "  ssh $remote"
Write-Host "  chmod +x ~/stone-chronicle-vps/*.sh"
Write-Host "  export STONE_DB_PASSWORD='（DB用パスワード）'"
Write-Host "  bash ~/stone-chronicle-vps/setup-server.sh"
Write-Host "  sudo mkdir -p /opt/stone-chronicle && sudo mv /tmp/stone-chronicle.jar /opt/stone-chronicle/"
Write-Host "  sudo cp ~/stone-chronicle-vps/stone-chronicle.env.example /etc/stone-chronicle.env"
Write-Host "  sudo nano /etc/stone-chronicle.env   # SPRING_DATASOURCE_PASSWORD を設定"
Write-Host "  sudo bash ~/stone-chronicle-vps/install-service.sh"
Write-Host ""
Write-Host "さくらパケットフィルタで TCP 8080（または 80/443）を許可してください。" -ForegroundColor Yellow
