# Run from repo root: copy bootJar and VPS helper scripts to Ubuntu.
# Example: .\scripts\vps\push-to-vps.ps1 -SshHost 133.167.90.218 -SshUser ubuntu
param(
	[string] $SshHost = "",
	[string] $SshUser = "ubuntu"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $root

if (-not $SshHost) {
	Write-Host "Usage: .\scripts\vps\push-to-vps.ps1 -SshHost YOUR_VPS_IP [-SshUser ubuntu]" -ForegroundColor Yellow
	exit 1
}

$libs = Join-Path $root "build\libs"
$pinnedJar = Join-Path $libs "nine-universe.jar"
if (Test-Path $pinnedJar) {
	$jar = Get-Item $pinnedJar
} else {
	# bootJar without archiveFileName yields *-SNAPSHOT.jar; exclude *-plain.jar
	$jar = Get-ChildItem -Path $libs -Filter "*.jar" -ErrorAction SilentlyContinue |
		Where-Object { $_.Name -notmatch '-plain\.jar$' } |
		Select-Object -First 1
}
if (-not $jar) {
	Write-Host "No JAR found. Run .\gradlew.bat bootJar first." -ForegroundColor Red
	exit 1
}

$remote = "${SshUser}@${SshHost}"
Write-Host "JAR: $($jar.Name) -> ${remote}:/tmp/nine-universe.jar"
scp $jar.FullName "${remote}:/tmp/nine-universe.jar"

$vpsDir = Join-Path $root "scripts\vps"
$deployDir = Join-Path $root "deploy"
Write-Host "Scripts -> ${remote}:~/nine-universe-vps/"
ssh $remote "mkdir -p ~/nine-universe-vps"
scp (Join-Path $vpsDir "setup-server.sh") "${remote}:~/nine-universe-vps/"
scp (Join-Path $vpsDir "setup-web-nginx.sh") "${remote}:~/nine-universe-vps/"
scp (Join-Path $vpsDir "install-service.sh") "${remote}:~/nine-universe-vps/"
scp (Join-Path $vpsDir "nine-universe.service") "${remote}:~/nine-universe-vps/"
scp (Join-Path $vpsDir "nine-universe.env.example") "${remote}:~/nine-universe-vps/"
scp (Join-Path $vpsDir "diagnose-on-server.sh") "${remote}:~/nine-universe-vps/"
$nginxExample = Join-Path $deployDir "nginx-site.conf.example"
if (Test-Path $nginxExample) {
	scp $nginxExample "${remote}:~/nine-universe-vps/nginx-site.conf"
}

Write-Host ""
Write-Host "Done. Full steps: deploy/SAKURA-VPS.md" -ForegroundColor Cyan
Write-Host "On the VPS, run:" -ForegroundColor Green
Write-Host "  ssh $remote"
Write-Host "  chmod +x ~/nine-universe-vps/*.sh"
Write-Host '  export NINE_UNIVERSE_DB_PASSWORD="your-db-password"'
Write-Host "  bash ~/nine-universe-vps/setup-server.sh"
Write-Host "  sudo mkdir -p /opt/nine-universe; sudo mv /tmp/nine-universe.jar /opt/nine-universe/"
Write-Host "  sudo cp ~/nine-universe-vps/nine-universe.env.example /etc/nine-universe.env"
Write-Host "  sudo nano /etc/nine-universe.env   # set SPRING_DATASOURCE_PASSWORD"
Write-Host "  sudo bash ~/nine-universe-vps/install-service.sh"
Write-Host ""
Write-Host "After DNS points to this VPS (check with ping):" -ForegroundColor Yellow
Write-Host '  export CERTBOT_EMAIL="you@example.com"'
Write-Host "  sudo -E bash ~/nine-universe-vps/setup-web-nginx.sh"
Write-Host ""
Write-Host "Sakura packet filter: allow TCP 22, 80, 443 (8080 can stay closed)." -ForegroundColor Yellow
