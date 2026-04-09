(function () {
	const app = document.getElementById('battle-app');
	if (!app) return;

	const battleLogModal = document.getElementById('battle-log-modal');
	const battleLogList = document.getElementById('battle-log-list');
	const battleLogOpenBtn = document.getElementById('battle-log-open');
	const battleLogCloseBtn = document.getElementById('battle-log-close');
	let lastEventLog = [];

	const csrfToken = document.querySelector('meta[name="_csrf"]')?.getAttribute('content') || '';
	const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content') || 'X-CSRF-TOKEN';
	const cardBack = document.querySelector('meta[name="card_back"]')?.getAttribute('content') || '';
	const contextPath = document.querySelector('meta[name="stone_context_path"]')?.getAttribute('content') || '';
	const plateFbFull = document.querySelector('meta[name="card_plate_fallback"]')?.getAttribute('content') || '';
	const dataFbFull = document.querySelector('meta[name="card_data_fallback"]')?.getAttribute('content') || '';
	const pvpMatchId = document.querySelector('meta[name="pvp_match_id"]')?.getAttribute('content') || '';
	const battleIsPvp = pvpMatchId.length > 0;
	const battleApiBase = battleIsPvp ? (contextPath + '/battle/pvp/api/' + encodeURIComponent(pvpMatchId)) : null;

	// Intercept surrender immediately (before async init finishes).
	const surrenderGuard = {
		installed: false,
		submitting: false
	};

	function absUrl(path) {
		if (path == null || path === '') return '';
		const p = String(path);
		if (p.startsWith('http://') || p.startsWith('https://')) return p;
		return contextPath + p;
	}

	// UI state (server state is fetched separately)
	const ui = {
		selectedInstanceId: null,
		levelUpRest: 0,
		levelUpStones: 0,
		levelUpDiscardIds: [],
		pay: { stones: 0, cardInstanceIds: [] },
		_cpuThinkTimer: null,
		_resolveTimer: null,
		_prevPowerByInstanceId: Object.create(null),
		warnLevelUpRest: null,
		warnLevelUpStone: null,
		sparkLevelUpRest: false,
		sparkLevelUpStone: false,
		_luPrevPowerInstanceId: null,
		_luPrevPower: null,
		_resultShown: false,
		_resultModalEl: null,
		_pvpPollTimer: null
	};

	function teardownResultModal() {
		if (ui._resultModalEl && ui._resultModalEl.parentNode) {
			ui._resultModalEl.remove();
		}
		ui._resultModalEl = null;
	}

	function showResultModal(kind, title, detail, options) {
		const o = options || {};
		teardownResultModal();
		hideBattleCardTooltip();
		hideBattleDeckTooltip();

		const overlay = el('div', 'battle-result-modal battle-result-modal--' + kind);
		overlay.setAttribute('role', 'dialog');
		overlay.setAttribute('aria-modal', 'true');
		overlay.setAttribute('aria-label', title || '結果');

		if (o.showy) {
			overlay.classList.add('battle-result-modal--showy');
			const burst = el('div', 'battle-result-modal__burst', null);
			burst.setAttribute('aria-hidden', 'true');
			overlay.appendChild(burst);
		}

		const panel = el('div', 'battle-result-modal__panel');
		const h = el('h2', 'battle-result-modal__title', title || '');
		const d = el('p', 'battle-result-modal__detail muted', detail || '');
		panel.appendChild(h);
		panel.appendChild(d);

		const actions = el('div', 'battle-result-modal__actions');
		const close = el('button', 'btn btn--ghost', '閉じる');
		close.type = 'button';
		actions.appendChild(close);
		panel.appendChild(actions);

		overlay.appendChild(panel);
		document.body.appendChild(overlay);
		ui._resultModalEl = overlay;

		function onClose() {
			teardownResultModal();
			if (typeof o.onClose === 'function') {
				o.onClose();
			}
		}
		close.addEventListener('click', onClose);
		// IMPORTANT: result modal must stay until user presses a button.
		// So we intentionally do NOT close on backdrop click or Escape.
		close.focus();
	}

	function isSurrenderForm(el) {
		if (!(el instanceof HTMLFormElement)) return false;
		const raw = (el.getAttribute('action') || '').trim();
		// Ignore query/hash and tolerate absolute/relative/context-prefixed URLs.
		const action = raw.split('#')[0].split('?')[0];
		if (action.indexOf('/battle/cpu/surrender') >= 0) return true;
		return /\/battle\/pvp\/api\/[^/]+\/surrender$/.test(action);
	}

	function installSurrenderIntercept() {
		if (surrenderGuard.installed) return;
		surrenderGuard.installed = true;

		function openSurrenderModalAndBlock(form) {
			if (!isSurrenderForm(form)) return;
			if (surrenderGuard.submitting) return;
			showResultModal('defeat', '敗北', '降参しました。', {
				onClose: function () {
					surrenderGuard.submitting = true;
					try { form.submit(); } catch (_) { /* ignore */ }
				}
			});
		}

		// Capture click on the surrender submit button to block navigation even if submit event
		// is bypassed (e.g. by other handlers calling form.submit()).
		document.addEventListener(
			'click',
			function (e) {
				const t = e.target;
				if (!(t instanceof Element)) return;
				const form = t.closest('form');
				if (!isSurrenderForm(form)) return;
				// Only intercept genuine submit triggers.
				const isSubmitTrigger =
					(t.closest('button[type="submit"]') != null) ||
					(t instanceof HTMLInputElement && (t.type || '').toLowerCase() === 'submit');
				if (!isSubmitTrigger) return;
				if (surrenderGuard.submitting) return;
				e.preventDefault();
				e.stopPropagation();
				openSurrenderModalAndBlock(form);
			},
			true
		);

		document.addEventListener(
			'submit',
			function (e) {
				const t = e.target;
				if (!isSurrenderForm(t)) return;
				if (surrenderGuard.submitting) return;
				e.preventDefault();
				openSurrenderModalAndBlock(t);
			},
			true // capture: run even if other handlers exist
		);
	}

	function maybeShowGameOverModal(st) {
		if (!st) return;
		if (!st.gameOver) {
			ui._resultShown = false;
			teardownResultModal();
			return;
		}
		if (ui._resultShown) return;
		ui._resultShown = true;

		const msg = st.lastMessage != null ? String(st.lastMessage) : '';
		if (st.humanWon) {
			const showy = msg.indexOf('勝利（CPUが相手以上のファイターを出せません）') >= 0;
			showResultModal('victory', '勝利', msg || '勝利しました。', {
				showy: showy,
				onClose: function () {
					// Return to home on victory close.
					window.location.href = contextPath + '/';
				}
			});
		} else {
			showResultModal('defeat', '敗北', msg || '敗北しました。');
		}
	}

	/** CardDefDto → card-face-layer.js（ライブラリと同一テンプレート） */
	function buildBattleCardFaceShell(d, variant) {
		if (typeof buildLibraryCardFace !== 'function') {
			const err = document.createElement('p');
			err.className = 'muted';
			err.textContent = 'カード表示用スクリプトの読み込みに失敗しています。';
			return err;
		}
		const face = buildLibraryCardFace(d, {
			contextPath: contextPath,
			plateFallback: plateFbFull,
			dataFallback: dataFbFull,
			extraRootClasses: 'battle-layered battle-layered--' + variant
		});
		wireLibraryCardFaceImages(face, plateFbFull, dataFbFull);
		applyLibraryCardFaceSpark(face, d.rarity);
		return wrapLibraryCardInner(face);
	}

	/** ライブラリグリッドの library-card と同じ内側ラッパ（枠・はみ出し抑制） */
	function wrapLibraryCardInner(face) {
		const shell = document.createElement('div');
		shell.className = 'library-card__inner';
		shell.appendChild(face);
		return shell;
	}

	/**
	 * fragments/library-card.html と同じ階層: library-card__open > library-card__inner（内側は既に inner）
	 * バトルゾーンのツールチップ用に外側は .battle-zone-card と兼用
	 */
	function wrapLibraryCardOpenChrome(inner) {
		const open = document.createElement('div');
		open.className = 'library-card__open library-card__open--battle';
		open.appendChild(inner);
		return open;
	}

	/** JSON の defs キーが数値/文字列どちらでも解決 */
	function resolveCardDef(defs, cardId) {
		if (defs == null || cardId == null) return null;
		if (defs[cardId] != null) return defs[cardId];
		const n = Number(cardId);
		if (!Number.isNaN(n) && defs[n] != null) return defs[n];
		const s = String(cardId);
		if (defs[s] != null) return defs[s];
		return null;
	}

	const battleTipEl = document.getElementById('battle-card-tooltip');
	const battleTipName = battleTipEl ? battleTipEl.querySelector('.battle-card-tooltip__name') : null;
	const battleTipAttr = battleTipEl ? battleTipEl.querySelector('.battle-card-tooltip__attr') : null;
	const battleTipAbility = battleTipEl ? battleTipEl.querySelector('.battle-card-tooltip__ability') : null;
	const battleTipPreview = battleTipEl ? battleTipEl.querySelector('.battle-card-tooltip__preview') : null;
	const deckTipEl = document.getElementById('battle-deck-tooltip');
	let lastDefsForTooltip = null;
	let lastStateForHandPower = null;

	function hideBattleCardTooltip() {
		if (battleTipPreview) battleTipPreview.textContent = '';
		if (battleTipEl) battleTipEl.hidden = true;
	}

	function hideBattleDeckTooltip() {
		if (deckTipEl) deckTipEl.hidden = true;
	}

	function positionBattleDeckTooltip(clientX, clientY) {
		if (!deckTipEl) return;
		const pad = 12;
		const tw = deckTipEl.offsetWidth;
		const th = deckTipEl.offsetHeight;
		let x = clientX + pad;
		let y = clientY + pad;
		if (x + tw > window.innerWidth - pad) {
			x = Math.max(pad, clientX - tw - pad);
		}
		if (y + th > window.innerHeight - pad) {
			y = Math.max(pad, window.innerHeight - th - pad);
		}
		deckTipEl.style.left = x + 'px';
		deckTipEl.style.top = y + 'px';
	}

	function showBattleDeckTooltip(count, clientX, clientY) {
		if (!deckTipEl) return;
		deckTipEl.textContent = String(count) + '枚';
		deckTipEl.hidden = false;
		positionBattleDeckTooltip(clientX, clientY);
	}

	function formatBattleCardAttr(d) {
		if (!d) return '—';
		if (d.attributeLabelLines && d.attributeLabelLines.length) {
			return d.attributeLabelLines.join('／');
		}
		return d.attributeLabelJa || d.attribute || '—';
	}

	function battleCardAbilityTooltipText(d) {
		if (!d || !d.abilityBlocks || !d.abilityBlocks.length) {
			return '効果なし。';
		}
		const chunks = [];
		d.abilityBlocks.forEach(function (b) {
			const h = b.headline != null ? String(b.headline).trim() : '';
			let body = b.body != null ? String(b.body) : '';
			body = body.replace(/能力なし。/g, '効果なし。');
			if (h) chunks.push(h);
			chunks.push(body || '—');
		});
		return chunks.join('\n');
	}

	function resolveDefByAbilityDeployCode(defs, abilityDeployCode, promptHint) {
		if (!defs || !abilityDeployCode) return null;
		const code = String(abilityDeployCode);
		const hint = promptHint != null ? String(promptHint) : '';
		let fallback = null;
		const keys = Object.keys(defs);
		for (let i = 0; i < keys.length; i++) {
			const d = defs[keys[i]];
			if (!d) continue;
			if (d.abilityDeployCode !== code) continue;
			// Prefer exact name match when available (prompt is often the card name)
			if (hint && d.name && String(d.name) === hint) return d;
			if (!fallback) fallback = d;
		}
		return fallback;
	}

	function fillBattleTooltipAbility(el, raw) {
		if (!el) return;
		el.textContent = '';
		const text = raw == null || raw === '' ? '—' : raw;
		if (text === '—') {
			el.textContent = '—';
			return;
		}
		const nl = text.indexOf('\n');
		const head = nl >= 0 ? text.slice(0, nl) : text;
		const rest = nl >= 0 ? text.slice(nl + 1) : '';
		if (head === '〈配置〉' || head === '〈常時〉') {
			const tag = document.createElement('span');
			tag.className = 'deck-tooltip__ability-tag';
			tag.textContent = head;
			el.appendChild(tag);
			if (rest) {
				el.appendChild(document.createElement('br'));
				const desc = document.createElement('span');
				desc.className = 'deck-tooltip__ability-desc';
				desc.textContent = rest;
				el.appendChild(desc);
			}
			return;
		}
		el.textContent = text;
	}

	function positionBattleCardTooltip(clientX, clientY) {
		if (!battleTipEl) return;
		const pad = 12;
		const tw = battleTipEl.offsetWidth;
		const th = battleTipEl.offsetHeight;
		let x = clientX + pad;
		let y = clientY + pad;
		if (x + tw > window.innerWidth - pad) {
			x = Math.max(pad, clientX - tw - pad);
		}
		if (y + th > window.innerHeight - pad) {
			y = Math.max(pad, window.innerHeight - th - pad);
		}
		battleTipEl.style.left = x + 'px';
		battleTipEl.style.top = y + 'px';
	}

	function showBattleCardTooltipFromDataset(host, clientX, clientY) {
		if (!battleTipEl || !battleTipName || !battleTipAttr || !battleTipAbility) return;
		hideBattleDeckTooltip();
		if (battleTipPreview) {
			battleTipPreview.textContent = '';
			const cid = host.dataset.battleCardId;
			if (cid && lastDefsForTooltip) {
				const def = resolveCardDef(lastDefsForTooltip, cid);
				if (def) {
					battleTipPreview.appendChild(buildBattleCardFaceShell(def, 'tip'));
				}
			}
		}
		battleTipName.textContent = host.dataset.battleName || '';
		battleTipAttr.textContent = host.dataset.battleAttr || '—';
		fillBattleTooltipAbility(battleTipAbility, host.dataset.battleAbility || '');
		battleTipEl.hidden = false;
		positionBattleCardTooltip(clientX, clientY);
	}

	function applyBattleCardTipData(el, d) {
		if (!el || !d) return;
		el.dataset.battleTip = '1';
		el.dataset.battleCardId = String(d.id != null ? d.id : '');
		el.dataset.battleName = d.name || '';
		el.dataset.battleAttr = formatBattleCardAttr(d);
		el.dataset.battleAbility = battleCardAbilityTooltipText(d);
	}

	function wireBattleCardTooltipHost(el) {
		if (!el || !battleTipEl) return;
		el.addEventListener('pointerenter', function (e) {
			showBattleCardTooltipFromDataset(el, e.clientX, e.clientY);
		});
		el.addEventListener('pointermove', function (e) {
			if (!battleTipEl.hidden) positionBattleCardTooltip(e.clientX, e.clientY);
		});
		el.addEventListener('pointerleave', hideBattleCardTooltip);
	}

	function wireBattleCardTooltips(root) {
		if (!root || !battleTipEl) return;
		root.querySelectorAll('[data-battle-tip="1"]').forEach(wireBattleCardTooltipHost);
	}

	async function fetchState() {
		const url = battleIsPvp ? (battleApiBase + '/state') : (contextPath + '/battle/cpu/state');
		const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
		if (res.status === 204) return null;
		if (!res.ok) throw new Error('state fetch failed: ' + res.status);
		return await res.json();
	}

	async function commitAction(payload) {
		const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
		if (csrfToken) headers[csrfHeader] = csrfToken;
		const url = battleIsPvp ? (battleApiBase + '/commit') : (contextPath + '/battle/cpu/commit');
		const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
		if (!res.ok) throw new Error('commit failed: ' + res.status);
		return await res.json();
	}

	async function cpuStep() {
		const headers = { 'Accept': 'application/json' };
		if (csrfToken) headers[csrfHeader] = csrfToken;
		const res = await fetch(contextPath + '/battle/cpu/cpu-step', { method: 'POST', headers });
		if (!res.ok) throw new Error('cpu-step failed: ' + res.status);
		return await res.json();
	}

	async function resolvePending() {
		const headers = { 'Accept': 'application/json' };
		if (csrfToken) headers[csrfHeader] = csrfToken;
		const url = battleIsPvp ? (battleApiBase + '/resolve') : (contextPath + '/battle/cpu/resolve');
		const res = await fetch(url, { method: 'POST', headers });
		if (!res.ok) throw new Error('resolve failed: ' + res.status);
		return await res.json();
	}

	function el(tag, cls, text) {
		const n = document.createElement(tag);
		if (cls) n.className = cls;
		if (text != null) n.textContent = text;
		return n;
	}

	function clamp(n, min, max) {
		return Math.max(min, Math.min(max, n));
	}

	function showPayModal(st) {
		const sel = selectedCard(st);
		if (!sel) return;
		const def = st.defs[sel.cardId];
		const cost = def ? Number(def.cost || 0) : 0;
		if (cost <= 0) {
			// コスト0はモーダル不要（commit側でそのまま進める）
			return;
		}

		ui.pay = { stones: 0, cardInstanceIds: [] };

		const overlay = el('div', 'battle-pay-modal');
		overlay.setAttribute('role', 'dialog');
		overlay.setAttribute('aria-modal', 'true');

		const panel = el('div', 'battle-pay-modal__panel');
		const closeBtn = el('button', 'battle-pay-modal__close', '×');
		closeBtn.type = 'button';
		panel.appendChild(closeBtn);

		panel.appendChild(el('h2', 'battle-pay-modal__title', 'コストの支払い方法'));
		panel.appendChild(el('p', 'muted', '必要コスト: ' + String(cost) + '（カード/ストーン/分割OK）'));

		const status = el('p', 'battle-pay-modal__status', '');
		panel.appendChild(status);

		const sectionStone = el('section', 'battle-pay-modal__section');
		sectionStone.appendChild(el('h3', '', 'ストーンで支払う'));
		const rowStone = el('div', 'battle-pay-modal__row');
		const minus = el('button', 'btn btn--ghost', '−');
		minus.type = 'button';
		const plus = el('button', 'btn btn--ghost', '+');
		plus.type = 'button';
		const stoneVal = el('div', 'battle-pay-modal__value', '0');
		rowStone.appendChild(minus);
		rowStone.appendChild(stoneVal);
		rowStone.appendChild(plus);
		sectionStone.appendChild(rowStone);
		panel.appendChild(sectionStone);

		const sectionCards = el('section', 'battle-pay-modal__section');
		sectionCards.appendChild(el('h3', '', 'カードで支払う（手札から選択）'));
		const grid = el('div', 'battle-pay-modal__cardgrid');
		const payCandidates = st.humanHand.filter((c) => {
			if (c.instanceId === sel.instanceId) return false;
			// レベルアップで選択したカードは、コスト支払いに使えない（ファイター下に差し込むため）
			if (ui.levelUpDiscardIds && ui.levelUpDiscardIds.indexOf(c.instanceId) >= 0) return false;
			return true;
		});
		payCandidates.forEach((c) => {
			const d = st.defs[c.cardId];
			const btn = el('button', 'battle-pay-modal__card', null);
			btn.type = 'button';
			btn.dataset.instanceId = c.instanceId;
			btn.dataset.selected = 'false';
			const caret = el('span', 'battle-pay-modal__caret', '▼');
			caret.setAttribute('aria-hidden', 'true');
			btn.appendChild(caret);
			if (d) {
				const shell = buildBattleCardFaceShell(d, 'modal');
				applyCurrentPowerDisplayToBattleCardFace(st, st.defs, shell, c.instanceId, d, { includeNextDeployBonus: true });
				btn.appendChild(shell);
				applyBattleCardTipData(btn, d);
			}
			grid.appendChild(btn);
		});
		sectionCards.appendChild(grid);
		panel.appendChild(sectionCards);

		const actions = el('div', 'battle-pay-modal__actions');
		const cancel = el('button', 'btn btn--ghost', 'キャンセル');
		cancel.type = 'button';
		const ok = el('button', 'btn btn--primary', 'OK');
		ok.type = 'button';
		ok.disabled = true;
		actions.appendChild(cancel);
		actions.appendChild(ok);
		panel.appendChild(actions);

		overlay.appendChild(panel);
		document.body.appendChild(overlay);
		wireBattleCardTooltips(overlay);

		function totalPaid() {
			return ui.pay.stones + ui.pay.cardInstanceIds.length;
		}

		function refresh() {
			const paid = totalPaid();
			const remain = cost - paid;
			stoneVal.textContent = String(ui.pay.stones);
			status.textContent = remain > 0
				? '残り ' + String(remain) + ' 必要です'
				: (remain === 0 ? 'OK（支払いが揃いました）' : '支払いが超過しています');
			ok.disabled = remain !== 0;
		}

		function teardown() {
			hideBattleCardTooltip();
			hideBattleDeckTooltip();
			overlay.remove();
		}

		function clamp(n, min, max) {
			return Math.max(min, Math.min(max, n));
		}

		minus.addEventListener('click', function () {
			ui.pay.stones = clamp(ui.pay.stones - 1, 0, st.humanStones);
			refresh();
		});
		plus.addEventListener('click', function () {
			ui.pay.stones = clamp(ui.pay.stones + 1, 0, st.humanStones);
			refresh();
		});

		grid.addEventListener('click', function (e) {
			const t = e.target;
			if (!(t instanceof Element)) return;
			const btn = t.closest('.battle-pay-modal__card');
			if (!btn) return;
			const inst = btn.getAttribute('data-instance-id');
			if (!inst) return;

			const i = ui.pay.cardInstanceIds.indexOf(inst);
			if (i >= 0) {
				ui.pay.cardInstanceIds.splice(i, 1);
				btn.classList.remove('is-selected');
			} else {
				ui.pay.cardInstanceIds.push(inst);
				btn.classList.add('is-selected');
			}
			refresh();
		});

		function onClose() {
			teardown();
		}

		closeBtn.addEventListener('click', onClose);
		cancel.addEventListener('click', onClose);
		overlay.addEventListener('click', function (e) {
			if (e.target === overlay) onClose();
		});

		ok.addEventListener('click', function () {
			const prev = captureAnimRects();
			teardown();
			const payload = {
				levelUpRest: ui.levelUpRest,
				levelUpDiscardInstanceIds: ui.levelUpDiscardIds,
				levelUpStones: ui.levelUpStones,
				deployInstanceId: sel.instanceId,
				payCostStones: ui.pay.stones,
				payCostCardInstanceIds: ui.pay.cardInstanceIds
			};
			commitAction(payload).then(function (next) {
				// 1ターン終了したのでUI入力はリセット
				ui.selectedInstanceId = null;
				ui.levelUpRest = 0;
				ui.levelUpStones = 0;
				ui.levelUpDiscardIds = [];
				ui.warnLevelUpRest = null;
				ui.warnLevelUpStone = null;
				ui._luPrevPowerInstanceId = null;
				ui._luPrevPower = null;
				ui.pay = { stones: 0, cardInstanceIds: [] };
				render(next);
				requestAnimationFrame(function () {
					playFLIP(prev);
				});
			}).catch(function (e) {
				// eslint-disable-next-line no-console
				console.error(e);
				alert('操作に失敗しました（' + e.message + '）');
				rerenderWithFreshState();
			});
		});

		refresh();
	}

	function showRestModal(restCards, defs, titleText) {
		const list = Array.isArray(restCards) ? restCards.slice() : [];
		const title = titleText || 'レスト';

		hideBattleCardTooltip();
		hideBattleDeckTooltip();

		const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

		const overlay = el('div', 'battle-pay-modal');
		overlay.classList.add('battle-rest-list-modal');
		overlay.setAttribute('role', 'dialog');
		overlay.setAttribute('aria-modal', 'true');
		overlay.setAttribute('aria-label', title + '一覧');

		const panel = el('div', 'battle-pay-modal__panel');
		const closeBtn = el('button', 'battle-pay-modal__close', '×');
		closeBtn.type = 'button';
		panel.appendChild(closeBtn);

		panel.appendChild(el('h2', 'battle-pay-modal__title', title));
		panel.appendChild(el('p', 'muted', '合計: ' + String(list.length) + '枚'));

		const grid = el('div', 'battle-pay-modal__cardgrid');
		list.forEach(function (c) {
			const d = resolveCardDef(defs, c.cardId);
			const host = el('div', 'battle-pay-modal__card', null);
			if (d) {
				host.appendChild(buildBattleCardFaceShell(d, 'modal'));
				applyBattleCardTipData(host, d);
			} else {
				const im = document.createElement('img');
				im.src = absUrl(cardBack);
				im.alt = '裏';
				host.appendChild(im);
			}
			grid.appendChild(host);
		});
		panel.appendChild(grid);

		overlay.appendChild(panel);
		document.body.appendChild(overlay);
		wireBattleCardTooltips(overlay);

		function teardown() {
			hideBattleCardTooltip();
			hideBattleDeckTooltip();
			overlay.remove();
			document.removeEventListener('keydown', onKey);
			if (previouslyFocused) {
				previouslyFocused.focus();
			}
		}

		function onKey(e) {
			if (e.key === 'Escape') {
				e.preventDefault();
				teardown();
			}
		}

		closeBtn.addEventListener('click', teardown);
		overlay.addEventListener('click', function (e) {
			if (e.target === overlay) teardown();
		});
		document.addEventListener('keydown', onKey);
		// フォーカスをモーダルへ（Enter/Spaceで開いた時にキー操作が効くように）
		closeBtn.focus();
	}

	function showLevelUpDiscardConfirmModal(st, onOk) {
		const sel = selectedCard(st);
		if (!sel) return;
		const hand = Array.isArray(st.humanHand) ? st.humanHand.slice() : [];
		const n = Math.max(0, Math.min(ui.levelUpRest | 0, hand.length));
		if (n <= 0) {
			if (typeof onOk === 'function') onOk();
			return;
		}
		const picked = [];

		hideBattleCardTooltip();
		hideBattleDeckTooltip();

		const overlay = el('div', 'battle-pay-modal');
		overlay.setAttribute('role', 'dialog');
		overlay.setAttribute('aria-modal', 'true');

		const panel = el('div', 'battle-pay-modal__panel');
		const closeBtn = el('button', 'battle-pay-modal__close', '×');
		closeBtn.type = 'button';
		panel.appendChild(closeBtn);

		panel.appendChild(el('h2', 'battle-pay-modal__title', 'カードを選択'));
		panel.appendChild(el('p', 'muted', '手札から' + String(n) + '枚選んで、ファイターの下に差し込みます'));

		const grid = el('div', 'battle-pay-modal__cardgrid');
		hand.forEach(function (c) {
			if (c.instanceId === sel.instanceId) return; // 配置カードは捨てられない
			const d = resolveCardDef(st.defs, c.cardId);
			const host = el('button', 'battle-pay-modal__card', null);
			host.type = 'button';
			host.dataset.instanceId = c.instanceId;
			if (d) {
				const shell = buildBattleCardFaceShell(d, 'modal');
				applyCurrentPowerDisplayToBattleCardFace(st, st.defs, shell, c.instanceId, d, { includeNextDeployBonus: true });
				host.appendChild(shell);
				applyBattleCardTipData(host, d);
			}
			grid.appendChild(host);
		});
		panel.appendChild(grid);

		const actions = el('div', 'battle-pay-modal__actions');
		const cancel = el('button', 'btn btn--ghost', 'キャンセル');
		cancel.type = 'button';
		const ok = el('button', 'btn btn--primary', 'OK');
		ok.type = 'button';
		ok.disabled = true;
		actions.appendChild(cancel);
		actions.appendChild(ok);
		panel.appendChild(actions);

		overlay.appendChild(panel);
		document.body.appendChild(overlay);
		wireBattleCardTooltips(overlay);

		function teardown() {
			hideBattleCardTooltip();
			hideBattleDeckTooltip();
			overlay.remove();
		}

		closeBtn.addEventListener('click', teardown);
		cancel.addEventListener('click', teardown);
		overlay.addEventListener('click', function (e) {
			if (e.target === overlay) teardown();
		});

		ok.addEventListener('click', function () {
			teardown();
			ui.levelUpDiscardIds = picked.slice();
			if (typeof onOk === 'function') onOk();
		});

		function refresh() {
			ok.disabled = picked.length !== n;
		}
		grid.addEventListener('click', function (e) {
			const t = e.target;
			if (!(t instanceof Element)) return;
			const btn = t.closest('.battle-pay-modal__card');
			if (!btn) return;
			const inst = btn.getAttribute('data-instance-id');
			if (!inst) return;
			const i = picked.indexOf(inst);
			if (i >= 0) {
				picked.splice(i, 1);
				btn.classList.remove('is-selected');
			} else {
				if (picked.length >= n) return;
				picked.push(inst);
				btn.classList.add('is-selected');
			}
			refresh();
		});
		refresh();
	}

	function wireDeckStackTooltip(wrap, count) {
		if (!deckTipEl || !wrap) return;
		wrap.addEventListener('pointerenter', function (e) {
			hideBattleCardTooltip();
			showBattleDeckTooltip(count, e.clientX, e.clientY);
		});
		wrap.addEventListener('pointermove', function (e) {
			if (!deckTipEl.hidden) positionBattleDeckTooltip(e.clientX, e.clientY);
		});
		wrap.addEventListener('pointerleave', hideBattleDeckTooltip);
	}

	function wireRestStackInteractions(wrap, count, onOpenList) {
		if (!wrap) return;
		// Hover: show "〇枚" popup (reuse deck tooltip)
		wireDeckStackTooltip(wrap, count);
		// Click: open list modal
		if (typeof onOpenList === 'function') {
			wrap.addEventListener('click', function () {
				onOpenList();
			});
			wrap.addEventListener('keydown', function (e) {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onOpenList();
				}
			});
		}
	}

	/** デッキ枚数ぶんカード裏を少しずつずらして重ねる（メタの card_back ＝ カードうら画像） */
	function renderDeckStackVisual(count, deckLabel, options) {
		const o = options || {};
		const offsetPx = o.stackOffsetPx != null ? o.stackOffsetPx : 3;
		const wrap = document.createElement('div');
		wrap.className = 'deck-stack deck-stack--visual';
		const n = Math.max(0, Math.floor(Number(count) || 0));
		wrap.setAttribute('role', 'img');
		wrap.setAttribute('aria-label', deckLabel + ' ' + n + '枚');

		if (n === 0) {
			wrap.appendChild(el('span', 'deck-stack__empty', '0枚'));
			wireDeckStackTooltip(wrap, n);
			return wrap;
		}

		const pile = el('div', 'deck-stack__pile');
		for (let i = 0; i < n; i++) {
			const im = document.createElement('img');
			im.src = absUrl(cardBack);
			im.alt = '';
			im.className = 'deck-stack__back';
			im.decoding = 'async';
			const fromTop = n - 1 - i;
			im.style.left = fromTop * offsetPx + 'px';
			im.style.top = fromTop * offsetPx + 'px';
			im.style.zIndex = String(i + 1);
			pile.appendChild(im);
		}
		wrap.appendChild(pile);
		wireDeckStackTooltip(wrap, n);
		return wrap;
	}

	/** レスト：置かれているカードを少し重ねて表示（一覧はクリックでモーダル） */
	function renderRestStackVisual(restCards, defs, titleText, options) {
		const o = options || {};
		const list = Array.isArray(restCards) ? restCards : [];
		const n = Math.max(0, Math.floor(list.length));
		const maxVisual = o.maxVisual != null ? o.maxVisual : 5;
		const offsetPx = o.stackOffsetPx != null ? o.stackOffsetPx : 3;

		const wrap = document.createElement('button');
		wrap.type = 'button';
		wrap.className = 'rest-stack deck-stack deck-stack--visual';
		wrap.setAttribute('aria-label', (titleText || 'レスト') + ' ' + String(n) + '枚');
		wrap.title = 'クリックで一覧';

		if (n === 0) {
			wrap.appendChild(el('span', 'deck-stack__empty', '0枚'));
			wireRestStackInteractions(wrap, n, function () {
				showRestModal(list, defs, titleText || 'レスト');
			});
			return wrap;
		}

		const pile = el('div', 'deck-stack__pile rest-stack__pile');
		const vis = Math.min(n, Math.max(1, maxVisual));
		const tail = list.slice(Math.max(0, n - vis)); // 上に出すのは直近（末尾）側
		for (let i = 0; i < tail.length; i++) {
			const c = tail[i];
			const d = resolveCardDef(defs, c.cardId);
			const cardHost = el('div', 'rest-stack__card');
			const fromTop = tail.length - 1 - i;
			cardHost.style.left = fromTop * offsetPx + 'px';
			cardHost.style.top = fromTop * offsetPx + 'px';
			cardHost.style.zIndex = String(i + 1);

			if (d) {
				// 表向き（レスト専用サイズは CSS で）
				cardHost.appendChild(buildBattleCardFaceShell(d, 'rest'));
			} else {
				const im = document.createElement('img');
				im.src = absUrl(cardBack);
				im.alt = '裏';
				im.className = 'deck-stack__back';
				im.decoding = 'async';
				cardHost.appendChild(im);
			}
			pile.appendChild(cardHost);
		}
		wrap.appendChild(pile);

		wireRestStackInteractions(wrap, n, function () {
			showRestModal(list, defs, titleText || 'レスト');
		});
		return wrap;
	}

	function renderHandCards(hand, defs, { faceDown, selectable, compactOpp, nextDeployBonus, nextElfOnlyBonus, nextDeployCostBonusTimes }) {
		const wrap = el('div', faceDown ? 'hand backs' : 'hand');
		if (faceDown && compactOpp) {
			wrap.classList.add('hand--opp-backs');
		}
		if (faceDown) {
			for (let i = 0; i < hand.length; i++) {
				const im = document.createElement('img');
				im.src = absUrl(cardBack);
				im.alt = '裏';
				wrap.appendChild(im);
			}
			return wrap;
		}
		hand.forEach((c) => {
			const d = defs[c.cardId];
			const cardWrap = el('button', 'hand-card battle-card', null);
			cardWrap.type = 'button';
			cardWrap.dataset.instanceId = c.instanceId;
			cardWrap.dataset.cardId = String(c.cardId);
			cardWrap.disabled = !selectable;
			if (ui.selectedInstanceId && ui.selectedInstanceId === c.instanceId) {
				cardWrap.classList.add('is-selected');
			}
			const caret = el('span', 'hand-card__select-caret', '▼');
			caret.setAttribute('aria-hidden', 'true');
			cardWrap.appendChild(caret);
			const focusWrap = el('div', 'hand-card__card-focus', null);
			focusWrap.dataset.animKey = 'card:' + c.instanceId;
			if (d) {
				const shell = buildBattleCardFaceShell(d, 'hand');
				const basePow = Number(d.basePower != null ? d.basePower : 0);
				let bonus = Number(nextDeployBonus || 0);
				if (Number(nextElfOnlyBonus || 0) > 0 && hasCardAttribute(d.attribute, 'ELF')) {
					bonus += Number(nextElfOnlyBonus || 0);
				}
				if (Number(nextDeployCostBonusTimes || 0) > 0) {
					const c = Number(d.cost != null ? d.cost : 0);
					bonus += c * Number(nextDeployCostBonusTimes || 0);
				}
				const curPow = lastStateForHandPower
					? previewHumanBattlePowerForHand(lastStateForHandPower, defs, d, bonus)
					: (basePow + bonus);
				applyCurrentPowerDisplay(shell, basePow, curPow);
				maybeSparkPowerIncrease(shell, c.instanceId, curPow);
				focusWrap.appendChild(shell);
				cardWrap.appendChild(focusWrap);
				applyBattleCardTipData(cardWrap, d);
			} else {
				cardWrap.appendChild(focusWrap);
			}
			wrap.appendChild(cardWrap);
		});
		return wrap;
	}

	function selectedCard(st) {
		if (!ui.selectedInstanceId) return null;
		return st.humanHand.find((c) => c.instanceId === ui.selectedInstanceId) || null;
	}

	/** CpuBattleEngine と同じ ID（effectiveBattlePower プレビュー用） */
	const PREVIEW_CARD_IDS = {
		RYUOH: 30,
		KUSURI: 8,
		ARCHER: 12,
		DRAGON_RIDER: 10,
		GAIKOTSU: 18,
		SHIREI: 20,
		HONE: 24
	};

	function attrSegments(attribute) {
		if (attribute == null || String(attribute).trim() === '') return [];
		return String(attribute).split('_').filter(Boolean);
	}

	function hasCardAttribute(attribute, tribe) {
		if (!tribe) return false;
		const a = attribute == null ? '' : String(attribute);
		if (!a) return false;
		if (a === tribe) return true;
		return attrSegments(a).indexOf(tribe) >= 0;
	}

	function zoneMainDef(zone, defs) {
		if (!zone || !zone.main) return null;
		return resolveCardDef(defs, zone.main.cardId);
	}

	function hasRyuohInCpuZone(cpuBattle, defs) {
		const d = zoneMainDef(cpuBattle, defs);
		return d != null && Number(d.id) === PREVIEW_CARD_IDS.RYUOH;
	}

	function hasRyuohInHumanZone(humanBattle, defs) {
		const d = zoneMainDef(humanBattle, defs);
		return d != null && Number(d.id) === PREVIEW_CARD_IDS.RYUOH;
	}

	/** レベルアップで右端から捨てた後の自分レスト（配置前・サーバ状態ベース） */
	function simulateHumanRestAfterLevelUp(st, levelUpRest) {
		const rest = (st.humanRest || []).slice();
		const hand = (st.humanHand || []).slice();
		const n = Math.min(levelUpRest | 0, hand.length);
		for (let i = 0; i < n; i++) {
			rest.push(hand.pop());
		}
		return rest;
	}

	function restContainsTribe(rest, defs, tribe) {
		for (let i = 0; i < rest.length; i++) {
			const d = resolveCardDef(defs, rest[i].cardId);
			if (d && hasCardAttribute(d.attribute, tribe)) return true;
		}
		return false;
	}

	function countUndeadInRest(rest, defs) {
		let c = 0;
		for (let i = 0; i < rest.length; i++) {
			const d = resolveCardDef(defs, rest[i].cardId);
			if (d && hasCardAttribute(d.attribute, 'UNDEAD')) c++;
		}
		return c;
	}

	function computeDeployBonus(def, levelUpRest, levelUpStones) {
		if (!def) return 0;
		return levelUpRest * 2 + levelUpStones * 2;
	}

	function computeHumanNextDeployBonusForDef(st, def) {
		if (!st || !def) return 0;
		let bonus = Number(st.humanNextDeployBonus || 0);
		const elfOnly = Number(st.humanNextElfOnlyBonus || 0);
		if (elfOnly > 0 && hasCardAttribute(def.attribute, 'ELF')) {
			bonus += elfOnly;
		}
		const costTimes = Number(st.humanNextDeployCostBonusTimes || 0);
		if (costTimes > 0) {
			const c = Number(def.cost != null ? def.cost : 0);
			bonus += c * costTimes;
		}
		return bonus;
	}

	/** 手札表示用: 「いま配置したら」の常時効果込み強さ（UIで選んだレベルアップ指定は含めない） */
	function previewHumanBattlePowerForHand(st, defs, mainDef, deployBonus) {
		if (!mainDef) return 0;
		const id = Number(mainDef.id);
		const base = Number(mainDef.basePower != null ? mainDef.basePower : 0);
		let p = base + Number(deployBonus || 0);

		// 竜王が相手ゾーンにいると常時効果は無効化
		if (hasRyuohInCpuZone(st.cpuBattle, defs)) {
			return Math.max(0, p);
		}

		// 以下は CpuBattleEngine.effectiveBattlePower 相当（自分視点）
		// 薬売り（相手の常時）: 相手が薬売りを配置している間、自分ファイターは相手ストーン数ぶん弱体化
		// ただし自分が竜王を配置している場合、相手の常時は無効
		if (!hasRyuohInHumanZone(st.humanBattle) && st.cpuBattle && st.cpuBattle.main) {
			const oppDef = resolveCardDef(defs, st.cpuBattle.main.cardId);
			if (oppDef && Number(oppDef.id) === PREVIEW_CARD_IDS.KUSURI) {
				p -= Number(st.cpuStones || 0);
			}
		}

		if (id === PREVIEW_CARD_IDS.ARCHER) {
			const opp = st.cpuBattle;
			if (opp && opp.main) {
				const od = resolveCardDef(defs, opp.main.cardId);
				if (!hasCardAttribute(od && od.attribute, 'DRAGON')) {
					p += 1;
				}
			}
		}

		if (id === PREVIEW_CARD_IDS.DRAGON_RIDER) {
			if (restContainsTribe(st.humanRest || [], defs, 'DRAGON')) {
				p += 4;
			}
		}

		if (id === PREVIEW_CARD_IDS.GAIKOTSU) {
			const opp = st.cpuBattle;
			if (opp && opp.main) {
				const od = resolveCardDef(defs, opp.main.cardId);
				if (hasCardAttribute(od && od.attribute, 'ELF')) {
					p += 2;
				}
			}
		}

		if (id === PREVIEW_CARD_IDS.SHIREI) {
			const opp = st.cpuBattle;
			if (opp && opp.main) {
				const od = resolveCardDef(defs, opp.main.cardId);
				if (!hasCardAttribute(od && od.attribute, 'HUMAN')) {
					p += 1;
				}
			}
		}

		if (id === PREVIEW_CARD_IDS.HONE) {
			p += countUndeadInRest(st.humanRest || [], defs);
		}

		return Math.max(0, p);
	}

	/**
	 * 選択カードを自分バトルゾーンに置いたときの強さ（CpuBattleEngine.effectiveBattlePower 相当）
	 */
	function previewHumanBattlePower(st, defs, mainDef, deployBonus) {
		if (!mainDef) return 0;
		const id = Number(mainDef.id);
		const base = Number(mainDef.basePower != null ? mainDef.basePower : 0);
		let p = base + deployBonus;

		if (hasRyuohInCpuZone(st.cpuBattle, defs)) {
			return Math.max(0, p);
		}

		const stonesAfterLevel = st.humanStones - (ui.levelUpStones | 0);
		const simRest = simulateHumanRestAfterLevelUp(st, ui.levelUpRest | 0);

		// 薬売り（相手の常時）: 相手が薬売りを配置している間、自分ファイターは相手ストーン数ぶん弱体化
		// ただし自分が竜王を配置している場合、相手の常時は無効
		if (!hasRyuohInHumanZone(st.humanBattle) && st.cpuBattle && st.cpuBattle.main) {
			const oppDef = resolveCardDef(defs, st.cpuBattle.main.cardId);
			if (oppDef && Number(oppDef.id) === PREVIEW_CARD_IDS.KUSURI) {
				p -= Number(st.cpuStones || 0);
			}
		}

		if (id === PREVIEW_CARD_IDS.ARCHER) {
			const opp = st.cpuBattle;
			if (opp && opp.main) {
				const od = resolveCardDef(defs, opp.main.cardId);
				if (!hasCardAttribute(od && od.attribute, 'DRAGON')) {
					p += 1;
				}
			}
		}

		if (id === PREVIEW_CARD_IDS.DRAGON_RIDER) {
			if (restContainsTribe(simRest, defs, 'DRAGON')) {
				p += 4;
			}
		}

		if (id === PREVIEW_CARD_IDS.GAIKOTSU) {
			const opp = st.cpuBattle;
			if (opp && opp.main) {
				const od = resolveCardDef(defs, opp.main.cardId);
				if (hasCardAttribute(od && od.attribute, 'ELF')) {
					p += 2;
				}
			}
		}

		if (id === PREVIEW_CARD_IDS.SHIREI) {
			const opp = st.cpuBattle;
			if (opp && opp.main) {
				const od = resolveCardDef(defs, opp.main.cardId);
				if (!hasCardAttribute(od && od.attribute, 'HUMAN')) {
					p += 1;
				}
			}
		}

		if (id === PREVIEW_CARD_IDS.HONE) {
			p += countUndeadInRest(simRest, defs);
		}

		return Math.max(0, p);
	}

	function applyLevelUpPreviewPower(shellRoot, basePower, previewPower) {
		const powEl = shellRoot.querySelector('.card-face__power');
		if (!powEl) return;
		const pv = Math.max(0, Math.floor(Number(previewPower)));
		const baseNum = Math.floor(Number(basePower));
		powEl.textContent = String(pv);
		powEl.classList.toggle('card-face__power--digit-4', pv === 4);
		powEl.classList.remove('battle-levelup-power--up', 'battle-levelup-power--down');
		if (pv > baseNum) powEl.classList.add('battle-levelup-power--up');
		else if (pv < baseNum) powEl.classList.add('battle-levelup-power--down');
	}

	function applyCurrentPowerDisplay(shellRoot, basePower, currentPower) {
		const powEl = shellRoot.querySelector('.card-face__power');
		if (!powEl) return;
		const pv = Math.max(0, Math.floor(Number(currentPower)));
		const baseNum = Math.floor(Number(basePower));
		powEl.textContent = String(pv);
		powEl.classList.toggle('card-face__power--digit-4', pv === 4);
		powEl.classList.remove('battle-levelup-power--up', 'battle-levelup-power--down');
		powEl.style.color = '';
		if (pv > baseNum) {
			powEl.classList.add('battle-levelup-power--up');
			powEl.style.color = '#22c55e';
		} else if (pv < baseNum) {
			powEl.classList.add('battle-levelup-power--down');
			powEl.style.color = '#ef4444';
		}
	}

	function maybeSparkPowerIncrease(shellRoot, instanceId, currentPower) {
		if (!shellRoot || !instanceId) return;
		const pv = Math.max(0, Math.floor(Number(currentPower)));
		const prev = ui._prevPowerByInstanceId[instanceId];
		ui._prevPowerByInstanceId[instanceId] = pv;
		if (prev == null) return;
		if (pv <= prev) return;
		const powEl = shellRoot.querySelector('.card-face__power');
		const sparkHost = wrapLevelUpPreviewPowerSparkHost(powEl);
		if (sparkHost) {
			appendLevelUpValueSparkBurst(sparkHost);
		}
	}

	function applyCurrentPowerDisplayToBattleCardFace(st, defs, shellRoot, instanceId, def, options) {
		if (!shellRoot || !def) return;
		const o = options || {};
		const basePow = Number(def.basePower != null ? def.basePower : 0);
		let bonus = 0;
		if (o.includeNextDeployBonus) {
			bonus += Number(st && st.humanNextDeployBonus || 0);
			const elfOnly = Number(st && st.humanNextElfOnlyBonus || 0);
			if (elfOnly > 0 && hasCardAttribute(def.attribute, 'ELF')) bonus += elfOnly;
			const costTimes = Number(st && st.humanNextDeployCostBonusTimes || 0);
			if (costTimes > 0) bonus += Number(def.cost != null ? def.cost : 0) * costTimes;
		}
		const curPow = st ? previewHumanBattlePowerForHand(st, defs, def, bonus) : (basePow + bonus);
		applyCurrentPowerDisplay(shellRoot, basePow, curPow);
		if (instanceId) {
			maybeSparkPowerIncrease(shellRoot, instanceId, curPow);
		}
	}

	/** 強さ表示周りのキラ（レベルアップ数値と同一アニメ）用。card-face__power は absolute のためホストで枠を取る */
	function wrapLevelUpPreviewPowerSparkHost(powEl) {
		if (!powEl || !powEl.parentNode) return null;
		const p = powEl.parentNode;
		if (p.classList && p.classList.contains('battle-levelup-preview-power-spark-host')) {
			return p;
		}
		const host = document.createElement('span');
		host.className = 'battle-levelup-preview-power-spark-host battle-control__value--spark-host';
		p.insertBefore(host, powEl);
		host.appendChild(powEl);
		return host;
	}

	function renderZone(zone, defs, power, opts) {
		opts = opts || {};
		const opponentZone = opts.opponentZone === true;
		const box = el('div', 'zone');
		if (!zone || !zone.main) {
			box.appendChild(el('p', 'muted', 'なし'));
			return box;
		}
		const d = resolveCardDef(defs, zone.main.cardId);
		if (d) {
			const wrap = el('div', 'library-card battle-zone-card', null);
			// Under-cards (cost/levelup): show as a small fanned stack of card backs
			const under = Array.isArray(zone.under) ? zone.under : [];
			if (under.length) {
				const stack = el('div', '', null);
				stack.style.position = 'absolute';
				// Peek out from behind the card (deck-like)
				stack.style.left = '-10px';
				stack.style.top = '-10px';
				stack.style.pointerEvents = 'none';
				stack.style.opacity = '0.95';
				stack.style.zIndex = '0';
				const n = Math.min(under.length, 6);
				for (let i = 0; i < n; i++) {
					const im = document.createElement('img');
					im.src = absUrl(cardBack);
					im.alt = '';
					im.style.position = 'absolute';
					im.style.width = '34px';
					im.style.height = '48px';
					im.style.borderRadius = '4px';
					im.style.boxShadow = '0 6px 16px rgba(0,0,0,.25)';
					im.style.transform = 'translate(' + (i * 5) + 'px,' + (i * 4) + 'px)';
					im.style.zIndex = String(1 + i);
					stack.appendChild(im);
				}
				if (under.length > n) {
					const badge = el('div', '', '+' + String(under.length - n));
					badge.style.position = 'absolute';
					badge.style.left = (n * 5 + 4) + 'px';
					badge.style.top = (n * 4 + 4) + 'px';
					badge.style.fontSize = '12px';
					badge.style.padding = '2px 6px';
					badge.style.borderRadius = '999px';
					badge.style.background = 'rgba(0,0,0,.55)';
					badge.style.color = '#fff';
					badge.style.boxShadow = '0 6px 16px rgba(0,0,0,.25)';
					stack.appendChild(badge);
				}
				wrap.style.position = 'relative';
				// allow stack to peek outside the card chrome
				wrap.style.overflow = 'visible';
				wrap.appendChild(stack);
			}
			const shell = buildBattleCardFaceShell(d, opponentZone ? 'hand' : 'zone');
			applyCurrentPowerDisplay(shell, Number(d.basePower || 0), power);
			maybeSparkPowerIncrease(shell, zone.main.instanceId, power);
			if (opponentZone) {
				/* 手札と同じ battle-layered--hand + hand-card__card-focus でキラ等の見え方を揃える */
				const faceMount = el('div', 'hand-card__card-focus battle-zone-card__opp-face', null);
				faceMount.dataset.animKey = 'card:' + zone.main.instanceId;
				faceMount.appendChild(shell);
				const chrome = wrapLibraryCardOpenChrome(faceMount);
				chrome.style.position = 'relative';
				chrome.style.zIndex = '1';
				wrap.appendChild(chrome);
			} else {
				wrap.dataset.animKey = 'card:' + zone.main.instanceId;
				const chrome = wrapLibraryCardOpenChrome(shell);
				chrome.style.position = 'relative';
				chrome.style.zIndex = '1';
				wrap.appendChild(chrome);
			}
			applyBattleCardTipData(wrap, d);
			box.appendChild(wrap);
		}
		box.appendChild(el('p', 'muted', '強さ: ' + String(power)));
		return box;
	}

	function captureAnimRects() {
		const m = new Map();
		app.querySelectorAll('[data-anim-key]').forEach(function (node) {
			const key = node.getAttribute('data-anim-key');
			if (!key) return;
			m.set(key, node.getBoundingClientRect());
		});
		return m;
	}

	function playFLIP(prevRects) {
		if (!prevRects || prevRects.size === 0) return;
		app.querySelectorAll('[data-anim-key]').forEach(function (node) {
			const key = node.getAttribute('data-anim-key');
			if (!key) return;
			const prev = prevRects.get(key);
			if (!prev) return;
			const next = node.getBoundingClientRect();
			const dx = prev.left - next.left;
			const dy = prev.top - next.top;
			if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
			node.animate(
				[
					{ transform: 'translate(' + dx + 'px,' + dy + 'px)' },
					{ transform: 'translate(0,0)' }
				],
				{ duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' }
			);
		});
	}

	function appendLevelUpValueSparkBurst(host) {
		host.classList.add('battle-control__value--spark-host');
		const backLayer = document.createElement('span');
		backLayer.className = 'battle-control__value-sparks battle-control__value-sparks--back';
		backLayer.setAttribute('aria-hidden', 'true');
		const layer = document.createElement('span');
		layer.className = 'battle-control__value-sparks';
		layer.setAttribute('aria-hidden', 'true');
		const n = 14;
		for (let i = 0; i < n; i++) {
			const t = (i / n) * Math.PI * 2 + i * 0.35;
			const r = 10 + (i % 4) * 5;
			const sx = (Math.cos(t) * r).toFixed(1) + 'px';
			const rise = '-' + (26 + (i % 5) * 4 + Math.floor(i / 3)).toFixed(1) + 'px';
			const delay = (i * 0.03).toFixed(3) + 's';

			const db = document.createElement('span');
			db.className = 'battle-control__value-spark battle-control__value-spark--back';
			db.style.setProperty('--sx', sx);
			db.style.setProperty('--rise', rise);
			db.style.setProperty('--delay', delay);
			backLayer.appendChild(db);

			const d = document.createElement('span');
			d.className = 'battle-control__value-spark';
			d.style.setProperty('--sx', sx);
			d.style.setProperty('--rise', rise);
			d.style.setProperty('--delay', delay);
			layer.appendChild(d);
		}
		host.appendChild(backLayer);
		host.appendChild(layer);
	}

	function buildLevelUpValueEl(numStr, sparkKey) {
		const wrap = document.createElement('div');
		wrap.className = 'battle-control__value';
		const num = document.createElement('span');
		num.className = 'battle-control__value-num';
		num.textContent = numStr;
		wrap.appendChild(num);
		if (sparkKey === 'rest' && ui.sparkLevelUpRest) {
			ui.sparkLevelUpRest = false;
			appendLevelUpValueSparkBurst(wrap);
		} else if (sparkKey === 'stone' && ui.sparkLevelUpStone) {
			ui.sparkLevelUpStone = false;
			appendLevelUpValueSparkBurst(wrap);
		}
		return wrap;
	}

	function buildHumanControlOverlayCluster(st) {
		if (!st.humansTurn || st.gameOver) return null;
		const panel = el('section', 'panel battle-control battle-control--levelup');
		panel.appendChild(el('h2', '', 'レベルアップ'));

		const sel = selectedCard(st);
		const selName = sel ? (st.defs[sel.cardId]?.name || '—') : '（未選択）';
		const selDef = sel ? resolveCardDef(st.defs, sel.cardId) : null;

		const body = el('div', 'battle-control--levelup__body');
		const controlsCol = el('div', 'battle-control--levelup__controls');
		controlsCol.appendChild(el('p', 'muted', '配置するカード: ' + selName));

		const row = el('div', 'battle-control__row');

		const restBox = el('div', 'battle-control__box');
		restBox.appendChild(el('div', 'battle-control__label', 'カードを捨ててレベルアップ'));
		restBox.appendChild(buildLevelUpValueEl(String(ui.levelUpRest), 'rest'));
		const restBtns = el('div', 'battle-control__btns');
		const restMinus = el('button', 'btn btn--ghost', '−');
		restMinus.type = 'button';
		restMinus.dataset.action = 'rest_minus';
		const restPlus = el('button', 'btn btn--ghost', '+');
		restPlus.type = 'button';
		restPlus.dataset.action = 'rest_plus';
		restBtns.appendChild(restMinus);
		restBtns.appendChild(restPlus);
		restBox.appendChild(restBtns);
		row.appendChild(restBox);

		const stoneBox = el('div', 'battle-control__box');
		stoneBox.appendChild(el('div', 'battle-control__label', 'ストーンを使ってレベルアップ'));
		stoneBox.appendChild(buildLevelUpValueEl(String(ui.levelUpStones), 'stone'));
		const stoneBtns = el('div', 'battle-control__btns');
		const stoneMinus = el('button', 'btn btn--ghost', '−');
		stoneMinus.type = 'button';
		stoneMinus.dataset.action = 'stone_minus';
		const stonePlus = el('button', 'btn btn--ghost', '+');
		stonePlus.type = 'button';
		stonePlus.dataset.action = 'stone_plus';
		stoneBtns.appendChild(stoneMinus);
		stoneBtns.appendChild(stonePlus);
		stoneBox.appendChild(stoneBtns);
		row.appendChild(stoneBox);

		controlsCol.appendChild(row);
		if (ui.warnLevelUpRest) {
			const wr = el('p', 'battle-control--levelup__warn', ui.warnLevelUpRest);
			wr.setAttribute('role', 'alert');
			controlsCol.appendChild(wr);
		}
		if (ui.warnLevelUpStone) {
			const ws = el('p', 'battle-control--levelup__warn', ui.warnLevelUpStone);
			ws.setAttribute('role', 'alert');
			controlsCol.appendChild(ws);
		}
		body.appendChild(controlsCol);

		const previewCol = el('div', 'battle-control--levelup__preview');
		if (selDef) {
			const deployB = computeDeployBonus(selDef, ui.levelUpRest, ui.levelUpStones)
				+ computeHumanNextDeployBonusForDef(st, selDef);
			const previewPow = previewHumanBattlePower(st, st.defs, selDef, deployB);
			const basePow = Number(selDef.basePower != null ? selDef.basePower : 0);
			const instId = sel.instanceId;
			let shouldSparkPower = false;
			if (
				ui._luPrevPowerInstanceId != null &&
				ui._luPrevPowerInstanceId === instId &&
				previewPow > ui._luPrevPower
			) {
				shouldSparkPower = true;
			}
			ui._luPrevPowerInstanceId = instId;
			ui._luPrevPower = previewPow;

			const previewWrap = el('div', 'library-card battle-control--levelup__preview-card');
			const shell = buildBattleCardFaceShell(selDef, 'hand');
			applyLevelUpPreviewPower(shell, basePow, previewPow);
			const powEl = shell.querySelector('.card-face__power');
			const sparkHost = wrapLevelUpPreviewPowerSparkHost(powEl);
			if (shouldSparkPower && sparkHost) {
				appendLevelUpValueSparkBurst(sparkHost);
			}
			previewWrap.appendChild(shell);
			applyBattleCardTipData(previewWrap, selDef);
			previewCol.appendChild(previewWrap);
		} else {
			previewCol.appendChild(el('p', 'muted battle-control--levelup__preview-empty', '—'));
		}
		body.appendChild(previewCol);

		panel.appendChild(body);

		const cancel = el('button', 'btn btn--ghost battle-control__cancel-external', 'キャンセル');
		cancel.type = 'button';
		cancel.dataset.action = 'cancel_levelup';

		const decide = el('button', 'btn btn--primary battle-control__decide-external', '決定');
		decide.type = 'button';
		decide.dataset.action = 'decide';

		const cluster = el('div', 'battle-control-overlay__cluster');
		const footer = el('div', 'battle-control__footer');
		footer.appendChild(cancel);
		footer.appendChild(decide);
		panel.appendChild(footer);
		cluster.appendChild(panel);

		return cluster;
	}

	async function sendChoice(payload) {
		const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
		if (csrfToken) headers[csrfHeader] = csrfToken;
		const url = battleIsPvp ? (battleApiBase + '/choice') : (contextPath + '/battle/cpu/choice');
		const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
		if (!res.ok) throw new Error('choice failed: ' + res.status);
		return await res.json();
	}

	/** render のたびに重ねてしまうと、OK/決定が手前の1枚だけ閉じて下に残るため同一内容なら作り直さない */
	function pendingChoiceModalKey(pc) {
		if (!pc || typeof pc !== 'object') return '';
		const ids = (pc.optionInstanceIds || []).slice().sort().join(',');
		return [
			String(pc.kind || ''),
			String(pc.prompt || ''),
			String(pc.stoneCost != null ? pc.stoneCost : ''),
			String(pc.abilityDeployCode || ''),
			pc.cpuSlotChooses ? '1' : '0',
			String(pc.viewerMayRespond !== undefined && pc.viewerMayRespond !== null ? pc.viewerMayRespond : ''),
			ids
		].join('\x1f');
	}

	function showChoiceModal(st) {
		const pc = st.pendingChoice;
		if (!pc) return;
		const may = pc.viewerMayRespond !== undefined && pc.viewerMayRespond !== null ? pc.viewerMayRespond : pc.forHuman;
		if (!may) return;

		const choiceKey = pendingChoiceModalKey(pc);
		const existingChoice = document.getElementById('battle-pending-choice-modal');
		if (existingChoice && existingChoice.dataset.pendingKey === choiceKey) {
			return;
		}
		if (existingChoice) existingChoice.remove();

		hideBattleCardTooltip();
		hideBattleDeckTooltip();

		const overlay = el('div', 'battle-pay-modal');
		overlay.id = 'battle-pending-choice-modal';
		overlay.dataset.pendingKey = choiceKey;
		overlay.setAttribute('role', 'dialog');
		overlay.setAttribute('aria-modal', 'true');

		const panel = el('div', 'battle-pay-modal__panel');
		const closeBtn = el('button', 'battle-pay-modal__close', '×');
		closeBtn.type = 'button';
		panel.appendChild(closeBtn);
		panel.appendChild(el('h2', 'battle-pay-modal__title', pc.prompt || '選択'));

		const picked = [];

		if (pc.kind === 'CONFIRM_OPTIONAL_STONE') {
			panel.appendChild(el('p', 'muted', 'ストーンを' + String(pc.stoneCost || 0) + '個使用しますか？'));

			// Show ability details for the card that triggered this choice (best-effort via abilityDeployCode).
			const detailDef = resolveDefByAbilityDeployCode(st.defs, pc.abilityDeployCode, pc.prompt);
			if (detailDef) {
				const detail = el('div', 'muted', null);
				detail.style.whiteSpace = 'pre-wrap';
				detail.style.wordBreak = 'break-word';
				detail.style.overflowWrap = 'anywhere';
				detail.style.lineHeight = '1.55';
				detail.style.marginTop = '0.55rem';
				detail.style.padding = '0.55rem 0.65rem';
				detail.style.borderRadius = '10px';
				detail.style.border = '1px solid rgba(255, 255, 255, 0.12)';
				detail.style.background = 'rgba(0, 0, 0, 0.18)';
				const raw = battleCardAbilityTooltipText(detailDef);
				const lines = String(raw || '').split('\n');
				const first = lines.length ? String(lines[0]).trim() : '';
				detail.textContent = (first === '〈配置〉' || first === '〈常時〉') ? lines.slice(1).join('\n') : String(raw || '—');
				panel.appendChild(detail);
			}

			const actions = el('div', 'battle-pay-modal__actions');
			const noBtn = el('button', 'btn btn--ghost', 'しない');
			noBtn.type = 'button';
			const yesBtn = el('button', 'btn btn--primary', '使用する');
			yesBtn.type = 'button';
			actions.appendChild(noBtn);
			actions.appendChild(yesBtn);
			panel.appendChild(actions);

			function teardown() {
				hideBattleCardTooltip();
				overlay.remove();
			}
			closeBtn.addEventListener('click', teardown);
			overlay.addEventListener('click', function (e) { if (e.target === overlay) teardown(); });

			noBtn.addEventListener('click', function () {
				const prev = captureAnimRects();
				teardown();
				sendChoice({ confirm: false, pickedInstanceIds: [] }).then(function (next) {
					render(next);
					requestAnimationFrame(function () { playFLIP(prev); });
					// choice 後は効果処理を進める
					return resolvePending();
				}).then(function (next2) {
					if (next2) render(next2);
				}).catch(function () { rerenderWithFreshState(); });
			});
			yesBtn.addEventListener('click', function () {
				const prev = captureAnimRects();
				teardown();
				sendChoice({ confirm: true, pickedInstanceIds: [] }).then(function (next) {
					render(next);
					requestAnimationFrame(function () { playFLIP(prev); });
					return resolvePending();
				}).then(function (next2) {
					if (next2) render(next2);
				}).catch(function () { rerenderWithFreshState(); });
			});
		} else if (pc.kind === 'CONFIRM_ACCEPT_LOSS') {
			panel.appendChild(el('p', 'muted', pc.prompt || 'このまま進めますか？'));
			const actions = el('div', 'battle-pay-modal__actions');
			const cancelBtn = el('button', 'btn btn--ghost', 'キャンセル');
			cancelBtn.type = 'button';
			const okBtn = el('button', 'btn btn--primary', 'はい');
			okBtn.type = 'button';
			actions.appendChild(cancelBtn);
			actions.appendChild(okBtn);
			panel.appendChild(actions);

			function teardown() {
				hideBattleCardTooltip();
				overlay.remove();
			}
			closeBtn.addEventListener('click', teardown);
			overlay.addEventListener('click', function (e) { if (e.target === overlay) teardown(); });

			cancelBtn.addEventListener('click', function () {
				const prev = captureAnimRects();
				teardown();
				sendChoice({ confirm: false, pickedInstanceIds: [] }).then(function (next) {
					render(next);
					requestAnimationFrame(function () { playFLIP(prev); });
				}).catch(function () { rerenderWithFreshState(); });
			});
			okBtn.addEventListener('click', function () {
				const prev = captureAnimRects();
				teardown();
				sendChoice({ confirm: true, pickedInstanceIds: [] }).then(function (next) {
					render(next);
					requestAnimationFrame(function () { playFLIP(prev); });
				}).catch(function () { rerenderWithFreshState(); });
			});
		} else {
			const grid = el('div', 'battle-pay-modal__cardgrid');
			const ids = pc.optionInstanceIds || [];
			ids.forEach(function (inst) {
				let card = null;
				(st.humanHand || []).forEach(function (c) { if (c.instanceId === inst) card = c; });
				(st.humanRest || []).forEach(function (c) { if (c.instanceId === inst) card = c; });
				if (!card) return;
				const d = resolveCardDef(st.defs, card.cardId);
				const btn = el('button', 'battle-pay-modal__card', null);
				btn.type = 'button';
				btn.dataset.instanceId = inst;
				if (d) {
					btn.appendChild(buildBattleCardFaceShell(d, 'modal'));
					applyBattleCardTipData(btn, d);
					wireBattleCardTooltipHost(btn);
				}
				grid.appendChild(btn);
			});
			panel.appendChild(grid);

			const actions = el('div', 'battle-pay-modal__actions');
			const cancel = el('button', 'btn btn--ghost', 'キャンセル');
			cancel.type = 'button';
			const ok = el('button', 'btn btn--primary', '決定');
			ok.type = 'button';
			ok.disabled = true;
			actions.appendChild(cancel);
			actions.appendChild(ok);
			panel.appendChild(actions);

			function needCount() {
				if (pc.kind === 'SELECT_SWAP_REST_AND_HAND') return 2;
				if (pc.kind === 'SELECT_TWO_FROM_HAND_TO_REST') return 2;
				return 1;
			}
			function refresh() { ok.disabled = picked.length !== needCount(); }

			grid.addEventListener('click', function (e) {
				const t = e.target;
				if (!(t instanceof Element)) return;
				const btn = t.closest('.battle-pay-modal__card');
				if (!btn) return;
				const inst = btn.getAttribute('data-instance-id');
				if (!inst) return;
				const idx = picked.indexOf(inst);
				if (idx >= 0) {
					picked.splice(idx, 1);
					btn.classList.remove('is-selected');
				} else {
					picked.push(inst);
					btn.classList.add('is-selected');
					if (picked.length > needCount()) {
						// keep last N
						const drop = picked.shift();
						const dropBtn = grid.querySelector('[data-instance-id="' + drop + '"]');
						if (dropBtn) dropBtn.classList.remove('is-selected');
					}
				}
				refresh();
			});

			function teardown() {
				hideBattleCardTooltip();
				overlay.remove();
			}
			closeBtn.addEventListener('click', teardown);
			cancel.addEventListener('click', teardown);
			overlay.addEventListener('click', function (e) { if (e.target === overlay) teardown(); });

			ok.addEventListener('click', function () {
				const prev = captureAnimRects();
				teardown();
				sendChoice({ confirm: true, pickedInstanceIds: picked.slice() }).then(function (next) {
					render(next);
					requestAnimationFrame(function () { playFLIP(prev); });
					return resolvePending();
				}).then(function (next2) {
					if (next2) render(next2);
				}).catch(function () { rerenderWithFreshState(); });
			});

			refresh();
		}

		overlay.appendChild(panel);
		document.body.appendChild(overlay);
	}

	function showBattleZoneDetailModal(def) {
		if (!def) return;
		hideBattleCardTooltip();
		hideBattleDeckTooltip();

		const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

		const overlay = el('div', 'battle-zone-detail-modal');
		overlay.setAttribute('role', 'dialog');
		overlay.setAttribute('aria-modal', 'true');
		overlay.setAttribute('aria-label', 'カード詳細');

		const panel = el('div', 'battle-zone-detail-modal__panel');
		const closeBtn = el('button', 'battle-zone-detail-modal__close', '×');
		closeBtn.type = 'button';
		closeBtn.setAttribute('aria-label', '閉じる');
		panel.appendChild(closeBtn);

		const grid = el('div', 'battle-zone-detail-modal__grid');
		const left = el('div', 'battle-zone-detail-modal__left');
		const right = el('div', 'battle-zone-detail-modal__right');

		const face = buildBattleCardFaceShell(def, 'zone');
		face.classList.add('battle-zone-detail-modal__card');
		left.appendChild(face);

		right.appendChild(el('h3', 'battle-zone-detail-modal__name', def.name || '—'));

		const stats = el('dl', 'battle-zone-detail-modal__stats');
		function statRow(label, value) {
			const wrap = el('div', 'battle-zone-detail-modal__stat');
			wrap.appendChild(el('dt', '', label));
			wrap.appendChild(el('dd', '', value));
			return wrap;
		}
		stats.appendChild(statRow('種族', formatBattleCardAttr(def)));
		stats.appendChild(statRow('コスト', String(def.cost != null ? def.cost : '—')));
		stats.appendChild(statRow('強さ', String(def.basePower != null ? def.basePower : '—')));
		stats.appendChild(statRow('★', String(def.rarity != null ? def.rarity : '—')));
		right.appendChild(stats);

		right.appendChild(el('p', 'battle-zone-detail-modal__label', '効果'));
		const ability = el('div', 'battle-zone-detail-modal__ability');
		ability.textContent = '';
		const raw = battleCardAbilityTooltipText(def);
		const lines = String(raw || '').split('\n');
		const first = lines.length ? String(lines[0]).trim() : '';
		ability.textContent = (first === '〈配置〉' || first === '〈常時〉') ? lines.slice(1).join('\n') : String(raw || '—');
		right.appendChild(ability);

		grid.appendChild(left);
		grid.appendChild(right);
		panel.appendChild(grid);
		overlay.appendChild(panel);
		document.body.appendChild(overlay);

		function teardown() {
			overlay.remove();
			document.removeEventListener('keydown', onKey);
			if (previouslyFocused) previouslyFocused.focus();
		}
		function onKey(e) {
			if (e.key === 'Escape') {
				e.preventDefault();
				teardown();
			}
		}

		closeBtn.addEventListener('click', teardown);
		overlay.addEventListener('click', function (e) {
			if (e.target === overlay) teardown();
		});
		document.addEventListener('keydown', onKey);
		closeBtn.focus();
	}

	function render(st) {
		lastStateForHandPower = st;
		lastDefsForTooltip = st.defs || null;
		app.innerHTML = '';
		hideBattleCardTooltip();
		hideBattleDeckTooltip();

		// Top "thinking" banner (fixed-ish inside app)
		if (st.phase === 'CPU_THINKING' || st.phase === 'OPPONENT_TURN') {
			const b = el('div', 'panel', null);
			b.style.position = 'sticky';
			b.style.top = '0';
			b.style.zIndex = '20';
			b.style.marginBottom = '10px';
			b.textContent = st.phase === 'OPPONENT_TURN' ? '相手の操作中…' : '考え中...';
			app.appendChild(b);
		}

		app.appendChild(el('p', 'battle-msg', st.lastMessage || '—'));

		const oppTop = el('section', 'battle-row battle-row--opp battle-band battle-band--opp');
		{
			const inner = el('div', 'battle-band__inner');

			const cellDeck = el('div', 'battle-cell battle-cell--compact battle-cell--opp-deck');
			cellDeck.appendChild(renderDeckStackVisual(st.cpuDeck.length, '相手デッキ'));
			inner.appendChild(cellDeck);

			const cellHand = el('div', 'battle-cell battle-cell--opp-hand');
			cellHand.appendChild(el('h3', '', '相手の手札'));
			const oppHandRow = el('div', 'battle-opp-hand-row');
			oppHandRow.appendChild(renderHandCards(st.cpuHand, st.defs, { faceDown: true, compactOpp: true, nextDeployBonus: 0, nextElfOnlyBonus: 0, nextDeployCostBonusTimes: 0 }));
			const oppStonesInline = el('div', 'battle-opp-hand-row__stones');
			oppStonesInline.setAttribute('aria-label', '相手ストーン所持数 ' + String(st.cpuStones));
			oppStonesInline.appendChild(el('span', 'battle-opp-hand-row__stones-label', 'ストーン'));
			oppStonesInline.appendChild(el('span', 'battle-opp-hand-row__stones-value', String(st.cpuStones)));
			oppHandRow.appendChild(oppStonesInline);
			cellHand.appendChild(oppHandRow);
			inner.appendChild(cellHand);

			const cellRest = el('div', 'battle-cell battle-cell--compact battle-cell--opp-rest');
			cellRest.appendChild(el('h3', '', 'レスト'));
			cellRest.appendChild(renderRestStackVisual(st.cpuRest, st.defs, 'レスト', { maxVisual: 4, stackOffsetPx: 2 }));
			inner.appendChild(cellRest);

			oppTop.appendChild(inner);
		}
		app.appendChild(oppTop);

		const zonesRow = el('section', 'battle-row battle-row--zones-split');
		{
			const zonesWrap = el('div', 'battle-zones-wrap');
			const zonesStack = el('div', 'battle-zones-stack');
			const cellZoneOpp = el('div', 'battle-cell battle-cell--zone battle-cell--zone-cpu');
			cellZoneOpp.appendChild(el('h3', '', 'バトルゾーン'));
			cellZoneOpp.appendChild(renderZone(st.cpuBattle, st.defs, st.cpuBattlePower, { opponentZone: true }));
			zonesStack.appendChild(cellZoneOpp);

			const cellZoneYou = el('div', 'battle-cell battle-cell--zone battle-cell--zone-human');
			cellZoneYou.appendChild(el('h3', '', 'バトルゾーン'));
			cellZoneYou.appendChild(renderZone(st.humanBattle, st.defs, st.humanBattlePower));
			zonesStack.appendChild(cellZoneYou);

			zonesWrap.appendChild(zonesStack);

			const controlCluster = buildHumanControlOverlayCluster(st);
			if (controlCluster && selectedCard(st) && st.phase !== 'HUMAN_CHOICE') {
				const overlay = el('div', 'battle-control-overlay');
				overlay.setAttribute('role', 'region');
				overlay.setAttribute('aria-label', 'レベルアップ');
				overlay.appendChild(controlCluster);
				zonesWrap.appendChild(overlay);
			}

			zonesRow.appendChild(zonesWrap);
		}
		app.appendChild(zonesRow);

		const you = el('section', 'battle-row battle-row--you battle-band battle-band--you');
		{
			const inner = el('div', 'battle-band__inner');
			const cellRest = el('div', 'battle-cell battle-cell--compact battle-cell--you-rest');
			cellRest.appendChild(el('h3', '', 'レスト'));
			cellRest.appendChild(renderRestStackVisual(st.humanRest, st.defs, 'レスト', { maxVisual: 5, stackOffsetPx: 3 }));
			inner.appendChild(cellRest);

			const cellHand = el('div', 'battle-cell battle-cell--you-hand');
			cellHand.appendChild(el('h3', '', '自分の手札'));
			const stonesTop = el('div', 'battle-you-hand-stones');
			stonesTop.setAttribute('aria-label', 'ストーン所持数 ' + String(st.humanStones));
			stonesTop.appendChild(el('span', 'battle-you-hand-stones__label', 'ストーン'));
			stonesTop.appendChild(el('span', 'battle-you-hand-stones__value', String(st.humanStones)));
			cellHand.appendChild(stonesTop);
			cellHand.appendChild(renderHandCards(st.humanHand, st.defs, {
				faceDown: false,
				selectable: st.humansTurn && !st.gameOver,
				nextDeployBonus: st.humanNextDeployBonus || 0,
				nextElfOnlyBonus: st.humanNextElfOnlyBonus || 0,
				nextDeployCostBonusTimes: st.humanNextDeployCostBonusTimes || 0
			}));
			inner.appendChild(cellHand);

			const cellDeck = el('div', 'battle-cell battle-cell--compact battle-cell--you-deck');
			cellDeck.appendChild(renderDeckStackVisual(st.humanDeck.length, '自分デッキ', { stackOffsetPx: 4 }));
			inner.appendChild(cellDeck);

			you.appendChild(inner);
		}
		app.appendChild(you);

		lastEventLog = st.eventLog && st.eventLog.length ? st.eventLog.slice() : [];
		if (battleLogModal && !battleLogModal.hidden) {
			fillBattleLogList(lastEventLog);
		}

		wireBattleCardTooltips(app);

		// game over modal (only once per battle end)
		maybeShowGameOverModal(st);

		// CPU random think (3-7s) → cpu-step（対人戦では使わない）
		if (st.phase === 'CPU_THINKING' && !st.gameOver && !st.pvpMatch) {
			if (ui._cpuThinkTimer == null) {
				const waitMs = 3000 + Math.floor(Math.random() * 4000);
				ui._cpuThinkTimer = window.setTimeout(function () {
					ui._cpuThinkTimer = null;
					const prev = captureAnimRects();
					cpuStep().then(function (next) {
						render(next);
						requestAnimationFrame(function () { playFLIP(prev); });
					}).catch(function (e) {
						// eslint-disable-next-line no-console
						console.error(e);
						rerenderWithFreshState();
					});
				}, waitMs);
			}
		} else if (ui._cpuThinkTimer != null) {
			clearTimeout(ui._cpuThinkTimer);
			ui._cpuThinkTimer = null;
		}

		if (st.pvpMatch && st.phase === 'OPPONENT_TURN' && !st.gameOver) {
			if (ui._pvpPollTimer == null) {
				ui._pvpPollTimer = window.setInterval(function () {
					rerenderWithFreshState().catch(function (e) {
						// eslint-disable-next-line no-console
						console.error(e);
					});
				}, 2000);
			}
		} else if (ui._pvpPollTimer != null) {
			clearInterval(ui._pvpPollTimer);
			ui._pvpPollTimer = null;
		}

		// Show effect for 3 seconds, then resolve
		if ((st.phase === 'HUMAN_EFFECT_PENDING' || st.phase === 'CPU_EFFECT_PENDING') && st.pendingEffect && !st.gameOver) {
			// cancel existing to avoid duplication
			if (ui._resolveTimer != null) {
				clearTimeout(ui._resolveTimer);
				ui._resolveTimer = null;
			}

			const pe = st.pendingEffect;
			const def = resolveCardDef(st.defs, pe.cardId);
			const side = el('div', 'panel', null);
			// absolute: scroll with the page (do NOT follow viewport)
			side.style.position = 'absolute';
			side.style.left = '16px';
			side.style.top = '92px';
			side.style.width = '360px';
			side.style.maxWidth = '42vw';
			side.style.maxHeight = '72vh';
			side.style.overflow = 'hidden';
			side.style.boxSizing = 'border-box';
			side.style.zIndex = '50';

			const head = el('div', '', null);
			head.style.display = 'flex';
			head.style.alignItems = 'baseline';
			head.style.justifyContent = 'space-between';
			head.style.gap = '10px';
			const title = el('h3', '', '効果');
			title.style.margin = '0';
			const tag = el('span', 'deck-tooltip__ability-tag', '〈配置〉');
			tag.style.flex = '0 0 auto';
			head.appendChild(title);
			head.appendChild(tag);
			side.appendChild(head);

			const name = el('p', 'muted', def && def.name ? String(def.name) : '—');
			name.style.marginTop = '6px';
			name.style.marginBottom = '8px';
			side.appendChild(name);

			const body = el('div', 'muted', null);
			body.style.whiteSpace = 'pre-wrap';
			body.style.wordBreak = 'break-word';
			body.style.overflowWrap = 'anywhere';
			body.style.lineHeight = '1.5';
			body.style.maxHeight = '52vh';
			body.style.overflow = 'auto';
			body.style.paddingRight = '6px'; // scrollbar gutter-ish
			const raw = battleCardAbilityTooltipText(def);
			// 先頭行が「〈配置〉」等の場合は見出しと重複するので落とす
			const lines = String(raw || '').split('\n');
			const first = lines.length ? String(lines[0]).trim() : '';
			body.textContent = (first === '〈配置〉' || first === '〈常時〉') ? lines.slice(1).join('\n') : String(raw || '—');
			side.appendChild(body);

			document.body.appendChild(side);

			// Position the effect popup next to the triggering fighter card (prefer the main instance).
			const positionEffectPopupNearCard = function () {
				const pad = 12;
				const inst = pe && pe.mainInstanceId ? String(pe.mainInstanceId) : '';
				if (!inst) return;
				const key = 'card:' + inst;
				const anchor = app.querySelector('[data-anim-key="' + key + '"]');
				if (!(anchor instanceof Element)) return;
				const r = anchor.getBoundingClientRect();
				// place to the right of card; if not enough space, flip to left
				const sw = side.offsetWidth || 360;
				const sh = side.offsetHeight || 240;
				let left = r.right + pad;
				if (left + sw > window.innerWidth - pad) {
					left = r.left - sw - pad;
				}
				left = Math.max(pad, Math.min(left, window.innerWidth - sw - pad));
				let top = r.top;
				top = Math.max(pad, Math.min(top, window.innerHeight - sh - pad));
				// convert viewport coords → document coords
				side.style.left = (left + window.scrollX) + 'px';
				side.style.top = (top + window.scrollY) + 'px';
			};

			// Initial position + keep stuck to the card while scrolling.
			positionEffectPopupNearCard();
			// Do not follow scroll: keep the position fixed after initial placement.

			ui._resolveTimer = window.setTimeout(function () {
				ui._resolveTimer = null;
				side.remove();
				const prev = captureAnimRects();
				resolvePending().then(function (next) {
					render(next);
					requestAnimationFrame(function () { playFLIP(prev); });
				}).catch(function (e) {
					// eslint-disable-next-line no-console
					console.error(e);
					rerenderWithFreshState();
				});
			}, 3000);
		}

		if (st.phase === 'HUMAN_CHOICE' && st.pendingChoice && !st.gameOver) {
			showChoiceModal(st);
		}
	}

	function fillBattleLogList(lines) {
		if (!battleLogList) return;
		battleLogList.innerHTML = '';
		if (!lines || !lines.length) {
			battleLogList.appendChild(el('li', 'battle-log-modal__empty', 'ログはまだありません。'));
			return;
		}
		lines.forEach(function (line) {
			battleLogList.appendChild(el('li', '', line));
		});
	}

	function openBattleLogModal() {
		if (!battleLogModal) return;
		fillBattleLogList(lastEventLog);
		battleLogModal.hidden = false;
		document.body.style.overflow = 'hidden';
		if (battleLogOpenBtn) battleLogOpenBtn.setAttribute('aria-expanded', 'true');
	}

	function closeBattleLogModal() {
		if (!battleLogModal) return;
		battleLogModal.hidden = true;
		document.body.style.overflow = '';
		if (battleLogOpenBtn) battleLogOpenBtn.setAttribute('aria-expanded', 'false');
	}

	function wireBattleLogModal() {
		if (battleLogOpenBtn) {
			battleLogOpenBtn.addEventListener('click', function () {
				openBattleLogModal();
			});
		}
		if (battleLogCloseBtn) {
			battleLogCloseBtn.addEventListener('click', function () {
				closeBattleLogModal();
			});
		}
		if (battleLogModal) {
			battleLogModal.addEventListener('click', function (e) {
				if (e.target === battleLogModal) {
					closeBattleLogModal();
				}
			});
		}
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && battleLogModal && !battleLogModal.hidden) {
				closeBattleLogModal();
			}
		});
	}

	async function rerenderWithFreshState() {
		const st = await fetchState();
		ui.levelUpStones = clamp(ui.levelUpStones, 0, st.humanStones);
		ui.levelUpRest = clamp(ui.levelUpRest, 0, st.humanHand.length);
		render(st);
	}

	/** レベルアップ欄を閉じる（外側クリック等）。手札カードを再選択すると再度開く */
	function cancelLevelUpInProgress() {
		ui.selectedInstanceId = null;
		ui.levelUpRest = 0;
		ui.levelUpStones = 0;
		ui.levelUpDiscardIds = [];
		ui.warnLevelUpRest = null;
		ui.warnLevelUpStone = null;
		ui.sparkLevelUpRest = false;
		ui.sparkLevelUpStone = false;
		ui._luPrevPowerInstanceId = null;
		ui._luPrevPower = null;
	}

	async function applyLevelUpAdjust(action) {
		const st = await fetchState();
		ui.levelUpStones = clamp(ui.levelUpStones, 0, st.humanStones);
		ui.levelUpRest = clamp(ui.levelUpRest, 0, st.humanHand.length);
		const handLen = st.humanHand ? st.humanHand.length : 0;

		if (action === 'rest_minus') {
			ui.warnLevelUpRest = null;
			ui.levelUpRest = clamp(ui.levelUpRest - 1, 0, handLen);
		} else if (action === 'rest_plus') {
			if (ui.levelUpRest >= handLen) {
				ui.warnLevelUpRest = 'これ以上、手札にカードがありません';
			} else {
				ui.warnLevelUpRest = null;
				ui.levelUpRest += 1;
				ui.sparkLevelUpRest = true;
			}
		} else if (action === 'stone_minus') {
			ui.warnLevelUpStone = null;
			ui.levelUpStones = clamp(ui.levelUpStones - 1, 0, st.humanStones);
		} else if (action === 'stone_plus') {
			if (ui.levelUpStones >= st.humanStones) {
				ui.warnLevelUpStone = 'これ以上、ストーンがありません';
			} else {
				ui.warnLevelUpStone = null;
				ui.levelUpStones += 1;
				ui.sparkLevelUpStone = true;
			}
		}
		render(st);
	}

	function attachHandlers() {
		app.addEventListener('click', function (e) {
			const t = e.target;
			if (!(t instanceof Element)) return;

			const zoneCard = t.closest('.battle-zone-card');
			if (zoneCard && zoneCard instanceof HTMLElement) {
				const cid = zoneCard.dataset.battleCardId;
				const d = cid ? resolveCardDef(lastDefsForTooltip, cid) : null;
				if (d) showBattleZoneDetailModal(d);
				return;
			}

			const cardBtn = t.closest('.battle-card');
			if (cardBtn && cardBtn instanceof HTMLButtonElement && !cardBtn.disabled) {
				const inst = cardBtn.dataset.instanceId || null;
				ui.selectedInstanceId = ui.selectedInstanceId === inst ? null : inst;
				if (!ui.selectedInstanceId) {
					ui._luPrevPowerInstanceId = null;
					ui._luPrevPower = null;
				}
				ui.warnLevelUpRest = null;
				ui.warnLevelUpStone = null;
				rerenderWithFreshState();
				return;
			}

			const actBtn = t.closest('button[data-action]');
			if (actBtn) {
				const action = actBtn.getAttribute('data-action');
				if (action) {
					if (
						action === 'rest_minus' ||
						action === 'rest_plus' ||
						action === 'stone_minus' ||
						action === 'stone_plus'
					) {
						applyLevelUpAdjust(action);
						return;
					}

					if (action === 'decide') {
						rerenderWithFreshState().then(function () {
							return fetchState();
						}).then(function (st) {
							const sel = selectedCard(st);
							if (!sel) return;

							function proceedAfterDiscardConfirm() {
								const def = resolveCardDef(st.defs, sel.cardId);
								const cost = def ? Number(def.cost || 0) : 0;
								if (cost <= 0) {
									const prev = captureAnimRects();
									const payload = {
										levelUpRest: ui.levelUpRest,
										levelUpDiscardInstanceIds: ui.levelUpDiscardIds,
										levelUpStones: ui.levelUpStones,
										deployInstanceId: sel.instanceId,
										payCostStones: 0,
										payCostCardInstanceIds: []
									};
									return commitAction(payload).then(function (next) {
										ui.selectedInstanceId = null;
										ui.levelUpRest = 0;
										ui.levelUpStones = 0;
										ui.levelUpDiscardIds = [];
										ui.warnLevelUpRest = null;
										ui.warnLevelUpStone = null;
										ui._luPrevPowerInstanceId = null;
										ui._luPrevPower = null;
										ui.pay = { stones: 0, cardInstanceIds: [] };
										render(next);
										requestAnimationFrame(function () {
											playFLIP(prev);
										});
									});
								}
								showPayModal(st);
							}

							if ((ui.levelUpRest | 0) > 0) {
								showLevelUpDiscardConfirmModal(st, proceedAfterDiscardConfirm);
								return;
							}

							proceedAfterDiscardConfirm();
						});
						return;
					}

					if (action === 'cancel_levelup') {
						cancelLevelUpInProgress();
						rerenderWithFreshState();
						return;
					}
				}
				rerenderWithFreshState();
				return;
			}

			if (t.closest('.battle-control-overlay__cluster')) {
				return;
			}

			if (ui.selectedInstanceId) {
				cancelLevelUpInProgress();
				rerenderWithFreshState();
			}
		});
	}

	(async function init() {
		wireBattleLogModal();
		installSurrenderIntercept();
		try {
			function applyBattleZoom() {
				const appEl = document.getElementById('battle-app');
				if (!appEl) return;
				const base = 980; // CSS の #battle-app 幅と揃える
				// 画面に収まるよう縮小のみ（拡大はしない）
				const z = Math.max(0.72, Math.min(1, window.innerWidth / (base + 24)));
				appEl.style.setProperty('--battle-zoom', String(z));
			}

			document.addEventListener('scroll', hideBattleCardTooltip, true);
			document.addEventListener('scroll', hideBattleDeckTooltip, true);
			window.addEventListener('resize', applyBattleZoom);
			applyBattleZoom();
			const st = await fetchState();
			render(st);
			attachHandlers();
		} catch (e) {
			app.innerHTML = '';
			const p = el('p', 'panel error', '読み込みに失敗しました。再読み込みしてください。');
			app.appendChild(p);
			// eslint-disable-next-line no-console
			console.error(e);
		}
	})();
})();

