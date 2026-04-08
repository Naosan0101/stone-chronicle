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
		pay: { stones: 0, cardInstanceIds: [] }
	};

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

	function hideBattleCardTooltip() {
		if (battleTipEl) battleTipEl.hidden = true;
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
		battleTipName.textContent = host.dataset.battleName || '';
		battleTipAttr.textContent = host.dataset.battleAttr || '—';
		fillBattleTooltipAbility(battleTipAbility, host.dataset.battleAbility || '');
		battleTipEl.hidden = false;
		positionBattleCardTooltip(clientX, clientY);
	}

	function applyBattleCardTipData(el, d) {
		if (!el || !d) return;
		el.dataset.battleTip = '1';
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
		const res = await fetch(contextPath + '/battle/cpu/state', { headers: { 'Accept': 'application/json' } });
		if (!res.ok) throw new Error('state fetch failed: ' + res.status);
		return await res.json();
	}

	async function commitAction(payload) {
		const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
		if (csrfToken) headers[csrfHeader] = csrfToken;
		const res = await fetch(contextPath + '/battle/cpu/commit', { method: 'POST', headers, body: JSON.stringify(payload) });
		if (!res.ok) throw new Error('commit failed: ' + res.status);
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
		const payCandidates = st.humanHand.filter((c) => c.instanceId !== sel.instanceId);
		payCandidates.forEach((c) => {
			const d = st.defs[c.cardId];
			const btn = el('button', 'battle-pay-modal__card', null);
			btn.type = 'button';
			btn.dataset.instanceId = c.instanceId;
			btn.dataset.selected = 'false';
			if (d) {
				btn.appendChild(buildBattleCardFaceShell(d, 'modal'));
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

	function renderHandCards(hand, defs, { faceDown, selectable, compactOpp }) {
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
				focusWrap.appendChild(buildBattleCardFaceShell(d, 'hand'));
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

	function computeDeployBonus(def, levelUpRest, levelUpStones) {
		if (!def) return 0;
		const perRest = def.abilityDeployCode === 'SHOKIN' ? 3 : 2;
		return levelUpRest * perRest + levelUpStones * 2;
	}

	function predictedDeployPower(st) {
		const sel = selectedCard(st);
		if (!sel) return null;
		const def = st.defs[sel.cardId];
		const base = def ? def.basePower : 0;
		return base + computeDeployBonus(def, ui.levelUpRest, ui.levelUpStones);
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
			const shell = buildBattleCardFaceShell(d, opponentZone ? 'hand' : 'zone');
			if (opponentZone) {
				/* 手札と同じ battle-layered--hand + hand-card__card-focus でキラ等の見え方を揃える */
				const faceMount = el('div', 'hand-card__card-focus battle-zone-card__opp-face', null);
				faceMount.dataset.animKey = 'card:' + zone.main.instanceId;
				faceMount.appendChild(shell);
				wrap.appendChild(wrapLibraryCardOpenChrome(faceMount));
			} else {
				wrap.dataset.animKey = 'card:' + zone.main.instanceId;
				wrap.appendChild(wrapLibraryCardOpenChrome(shell));
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

	function render(st) {
		app.innerHTML = '';
		hideBattleCardTooltip();

		app.appendChild(el('p', 'battle-msg', st.lastMessage || '—'));

		const oppTop = el('section', 'battle-row battle-row--opp');
		{
			const cellHand = el('div', 'battle-cell');
			cellHand.appendChild(el('h3', '', '相手の手札'));
			cellHand.appendChild(renderHandCards(st.cpuHand, st.defs, { faceDown: true, compactOpp: true }));
			oppTop.appendChild(cellHand);

			const cellStone = el('div', 'battle-cell');
			cellStone.appendChild(el('h3', '', '相手ストーン'));
			cellStone.appendChild(el('p', 'stone-count', String(st.cpuStones)));
			oppTop.appendChild(cellStone);
		}
		app.appendChild(oppTop);

		const mid1 = el('section', 'battle-row battle-row--mid');
		{
			const cellDeck = el('div', 'battle-cell');
			cellDeck.appendChild(el('h3', '', '相手デッキ'));
			cellDeck.appendChild(el('div', 'deck-stack', String(st.cpuDeck.length) + '枚'));
			mid1.appendChild(cellDeck);

			const cellZone = el('div', 'battle-cell');
			cellZone.appendChild(el('h3', '', '相手バトルゾーン'));
			cellZone.appendChild(renderZone(st.cpuBattle, st.defs, st.cpuBattlePower, { opponentZone: true }));
			mid1.appendChild(cellZone);

			const cellRest = el('div', 'battle-cell');
			cellRest.appendChild(el('h3', '', '相手レスト'));
			cellRest.appendChild(el('p', '', String(st.cpuRest.length) + '枚'));
			mid1.appendChild(cellRest);
		}
		app.appendChild(mid1);

		const mid2 = el('section', 'battle-row battle-row--mid');
		{
			const cellRest = el('div', 'battle-cell');
			cellRest.appendChild(el('h3', '', '自分レスト'));
			cellRest.appendChild(el('p', '', String(st.humanRest.length) + '枚'));
			mid2.appendChild(cellRest);

			const cellZone = el('div', 'battle-cell');
			cellZone.appendChild(el('h3', '', '自分バトルゾーン'));
			cellZone.appendChild(renderZone(st.humanBattle, st.defs, st.humanBattlePower));
			mid2.appendChild(cellZone);

			const cellDeck = el('div', 'battle-cell');
			cellDeck.appendChild(el('h3', '', '自分デッキ'));
			cellDeck.appendChild(el('div', 'deck-stack', String(st.humanDeck.length) + '枚'));
			mid2.appendChild(cellDeck);
		}
		app.appendChild(mid2);

		const you = el('section', 'battle-row battle-row--you');
		{
			const cellStone = el('div', 'battle-cell');
			cellStone.appendChild(el('h3', '', '自分ストーン'));
			cellStone.appendChild(el('p', 'stone-count stone-count--small', String(st.humanStones)));
			you.appendChild(cellStone);

			const cellHand = el('div', 'battle-cell battle-cell--wide');
			cellHand.appendChild(el('h3', '', '自分の手札'));
			cellHand.appendChild(renderHandCards(st.humanHand, st.defs, { faceDown: false, selectable: st.humansTurn && !st.gameOver }));
			you.appendChild(cellHand);
		}
		app.appendChild(you);

		if (st.humansTurn && !st.gameOver) {
			const panel = el('section', 'panel battle-control');
			panel.appendChild(el('h2', '', '操作'));

			const sel = selectedCard(st);
			const selName = sel ? (st.defs[sel.cardId]?.name || '—') : '（未選択）';
			panel.appendChild(el('p', 'muted', '配置するカード: ' + selName));

			const pred = predictedDeployPower(st);
			panel.appendChild(el('p', 'muted', '予想強さ: ' + (pred == null ? '—' : String(pred))));

			const row = el('div', 'battle-control__row');

			const restBox = el('div', 'battle-control__box');
			restBox.appendChild(el('div', 'battle-control__label', 'レベルアップ：捨てる枚数'));
			restBox.appendChild(el('div', 'battle-control__value', String(ui.levelUpRest)));
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
			stoneBox.appendChild(el('div', 'battle-control__label', '強化：ストーン使用（1回=+2）'));
			stoneBox.appendChild(el('div', 'battle-control__value', String(ui.levelUpStones)));
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

			panel.appendChild(row);

			panel.appendChild(el('p', 'muted', '次は「決定」で支払い方法（カード/ストーン/分割）を選びます。'));

			const decide = el('button', 'btn btn--primary', '決定');
			decide.type = 'button';
			decide.dataset.action = 'decide';
			panel.appendChild(decide);

			app.appendChild(panel);
		}

		lastEventLog = st.eventLog && st.eventLog.length ? st.eventLog.slice() : [];
		if (battleLogModal && !battleLogModal.hidden) {
			fillBattleLogList(lastEventLog);
		}

		wireBattleCardTooltips(app);
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

	function attachHandlers() {
		app.addEventListener('click', function (e) {
			const t = e.target;
			if (!(t instanceof Element)) return;

			const cardBtn = t.closest('.battle-card');
			if (cardBtn && cardBtn instanceof HTMLButtonElement && !cardBtn.disabled) {
				const inst = cardBtn.dataset.instanceId || null;
				ui.selectedInstanceId = ui.selectedInstanceId === inst ? null : inst;
				rerenderWithFreshState();
				return;
			}

			const actBtn = t.closest('button[data-action]');
			if (!actBtn) return;
			const action = actBtn.getAttribute('data-action');
			if (!action) return;

			if (action === 'rest_minus') ui.levelUpRest = clamp(ui.levelUpRest - 1, 0, 4);
			if (action === 'rest_plus') ui.levelUpRest = clamp(ui.levelUpRest + 1, 0, 4);
			if (action === 'stone_minus') ui.levelUpStones = clamp(ui.levelUpStones - 1, 0, 99);
			if (action === 'stone_plus') ui.levelUpStones = clamp(ui.levelUpStones + 1, 0, 99);

			// decideは次TODOでモーダルにする
			if (action === 'decide') {
				rerenderWithFreshState().then(function () {
					// rerenderで最新stateを描画後、同じstateでモーダルを表示したいので再取得
					return fetchState();
				}).then(function (st) {
					showPayModal(st);
				});
				return;
			}
			rerenderWithFreshState();
		});
	}

	(async function init() {
		wireBattleLogModal();
		try {
			document.addEventListener('scroll', hideBattleCardTooltip, true);
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

