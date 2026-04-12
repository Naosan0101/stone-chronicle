const path = require('path');
const { app, BrowserWindow, Menu } = require('electron');

/**
 * Windows 等で「タイトルだけ更新されて中身が真っ黒／グリッドだけ」になることがある。
 * GPU ドライバとの相性問題が多いので既定ではオフ。必要なら ELECTRON_USE_GPU=1 で有効化。
 */
if (process.env.ELECTRON_USE_GPU !== '1') {
	app.disableHardwareAcceleration();
}

try {
	app.commandLine.appendSwitch('disk-cache-dir', path.join(app.getPath('userData'), 'browser-cache'));
} catch (_) {
	// ignore
}

/** 本番は nine-universe.jp。開発時は環境変数で上書き可能。 */
const START_URL = process.env.NINE_UNIVERSE_URL || 'https://nine-universe.jp';

function escapeHtml(s) {
	return String(s)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/** 接続失敗時は黒画面のままにせず、原因のヒントを表示する */
function loadConnectionErrorPage(win, failedUrl, errorDescription) {
	const body = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>接続できません</title><style>
body{font-family:system-ui,"Segoe UI","Meiryo",sans-serif;background:#0f1118;color:#e8e8ec;padding:2rem;line-height:1.65;max-width:42rem;margin:0 auto}
h1{font-size:1.15rem;color:#e8a0a0;margin-top:0}
p{margin:0.75rem 0}
code{word-break:break-all;font-size:0.88rem;background:#1a1e2a;padding:0.15rem 0.4rem;border-radius:4px}
.box{background:#171b26;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:1rem 1.1rem;margin:1rem 0}
ul{padding-left:1.2rem;margin:0.5rem 0}
</style></head><body>
<h1>ページを読み込めませんでした</h1>
<p>Electron から次の URL へ接続できませんでした。</p>
<div class="box"><strong>URL</strong><br/><code>${escapeHtml(failedUrl)}</code></div>
<p><strong>エラー</strong> <code>${escapeHtml(errorDescription)}</code></p>
<p><strong>よくある原因</strong></p>
<ul>
<li>本番サーバーがまだ起動していない、または VPS / DNS / パケットフィルターの設定が未完了</li>
<li>PC や回線の側でブロックされている（ブラウザでも同じ URL が開けないか確認）</li>
</ul>
<p><strong>ローカルで動かす場合</strong>：先に Spring Boot を起動し、次のいずれかで起動してください。</p>
<div class="box"><code>npm run start:local</code><br/>または PowerShell:<br/><code>$env:NINE_UNIVERSE_URL=&quot;http://127.0.0.1:8080&quot;; npm start</code></div>
</body></html>`;
	win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(body));
}

function createWindow() {
	const win = new BrowserWindow({
		width: 1280,
		height: 800,
		minWidth: 360,
		minHeight: 640,
		autoHideMenuBar: true,
		backgroundColor: '#0f1118',
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
		},
	});

	win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
		if (!isMainFrame) {
			return;
		}
		// ERR_ABORTED（遷移キャンセルなど）は無視
		if (errorCode === -3) {
			return;
		}
		loadConnectionErrorPage(win, validatedURL, errorDescription);
	});

	win.loadURL(START_URL);
}

app.whenReady().then(() => {
	Menu.setApplicationMenu(null);
	createWindow();
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
