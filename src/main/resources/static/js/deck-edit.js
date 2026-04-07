(function () {
	const contextPath = document.querySelector('meta[name="stone_context_path"]')?.getAttribute('content') || '';
	const plateFbFull = document.querySelector('meta[name="card_plate_fallback"]')?.getAttribute('content') || '';
	const dataFbFull = document.querySelector('meta[name="card_data_fallback"]')?.getAttribute('content') || '';
	function staticUrl(path) {
		if (path == null || path === '') return '';
		const p = String(path);
		if (p.startsWith('http://') || p.startsWith('https://')) return p;
		return contextPath + p;
	}

	const libZone = document.getElementById('lib-zone');
	const deckZone = document.getElementById('deck-zone');
	const deckCount = document.getElementById('deck-count');
	const completeBtn = document.getElementById('complete-btn');
	const cardIdsInput = document.getElementById('cardIds');
	const preview = document.getElementById('preview');
	const previewImg = document.getElementById('preview-img');
	const previewFace = document.getElementById('preview-face');
	const libSearch = document.getElementById('lib-search');
	const libSort = document.getElementById('lib-sort');
	const libFilterAttr = document.getElementById('lib-filter-attr');
	const libFilterPower = document.getElementById('lib-filter-power');
	const tooltipEl = document.getElementById('deck-tooltip');
	const tooltipName = tooltipEl.querySelector('.deck-tooltip__name');
	const tooltipAttr = tooltipEl.querySelector('.deck-tooltip__attr');
	const tooltipCost = tooltipEl.querySelector('.deck-tooltip__cost');
	const tooltipPower = tooltipEl.querySelector('.deck-tooltip__power');
	const tooltipAbility = tooltipEl.querySelector('.deck-tooltip__ability');

	const ATTR_LABEL = { HUMAN: '人間', ELF: 'エルフ', UNDEAD: 'アンデッド', DRAGON: 'ドラゴン' };

	function matchesTribeFilter(cardAttr, filterVal) {
		if (!filterVal) return true;
		if (!cardAttr) return false;
		if (cardAttr === filterVal) return true;
		return cardAttr.split('_').indexOf(filterVal) !== -1;
	}

	function attributeLabelJa(code, preset) {
		if (preset) return preset;
		if (!code) return '';
		if (code.indexOf('_') !== -1) {
			return code.split('_').map(function (seg) {
				return ATTR_LABEL[seg] || seg;
			}).join(' ');
		}
		return ATTR_LABEL[code] || code;
	}

	const seeds = Array.from(document.querySelectorAll('#lib-seed .seed')).map(function (el) {
		const p = parseInt(el.dataset.power, 10);
		const cost = parseInt(el.dataset.cost, 10);
		return {
			id: parseInt(el.dataset.id, 10),
			img: staticUrl(el.dataset.img || ''),
			layerBase: el.dataset.layerBase || '',
			layerPortrait: el.dataset.layerPortrait || '',
			layerBar: el.dataset.layerBar || '',
			layerFrame: el.dataset.layerFrame || '',
			qty: parseInt(el.dataset.qty, 10) || 0,
			name: el.dataset.name || '',
			attribute: el.dataset.attribute || '',
			attributeLabelJa: el.dataset.attributeLabel || '',
			attrLines: (function () {
				const p = el.dataset.attrPipe || '';
				return p ? p.split('|').filter(Boolean) : [];
			})(),
			power: isNaN(p) ? 0 : p,
			cost: isNaN(cost) ? 0 : cost,
			ability: el.dataset.ability || ''
		};
	}).filter(function (c) { return c.qty > 0 && !isNaN(c.id); });

	const selectedSpans = document.querySelectorAll('#selected-seed span');
	const initialDeck = Array.from(selectedSpans).map(function (s) { return parseInt(s.textContent.trim(), 10); })
		.filter(function (n) { return !isNaN(n); });

	function countInDeck(id) {
		return Array.from(deckZone.querySelectorAll('.mini-card')).filter(function (n) {
			return parseInt(n.dataset.id, 10) === id;
		}).length;
	}

	function canAddToDeck(id, maxPerCard) {
		if (deckZone.querySelectorAll('.mini-card').length >= 8) return false;
		return countInDeck(id) < maxPerCard;
	}

	function maxPerForId(id) {
		const row = seeds.find(function (s) { return s.id === id; });
		const owned = row ? row.qty : 0;
		return Math.min(2, owned);
	}

	function cmpPower(a, b) {
		return a.power - b.power;
	}

	function cmpName(a, b) {
		return a.name.localeCompare(b.name, 'ja');
	}

	function sortedLibraryList() {
		const q = libSearch ? libSearch.value.trim() : '';
		const attrF = libFilterAttr ? libFilterAttr.value : '';
		const powF = libFilterPower ? libFilterPower.value : '';
		let list = seeds.filter(function (c) {
			if (q && c.name.indexOf(q) === -1) return false;
			if (attrF && !matchesTribeFilter(c.attribute, attrF)) return false;
			if (powF !== '' && c.power !== parseInt(powF, 10)) return false;
			return true;
		});
		const mode = libSort ? libSort.value : 'power_asc';
		list = list.slice();
		list.sort(function (a, b) {
			let r;
			if (mode === 'power_desc') {
				r = cmpPower(b, a);
			} else {
				r = cmpPower(a, b);
			}
			if (r !== 0) return r;
			return cmpName(a, b);
		});
		return list;
	}

	function elSpan(cls, text) {
		const s = document.createElement('span');
		s.className = cls;
		s.textContent = text != null ? String(text) : '';
		return s;
	}

	function buildMiniLayered(c) {
		const face = document.createElement('div');
		face.className = 'card-face card-face--layered card-face--compact card-face--mini-deck';
		if (c.attribute) {
			face.classList.add('card-face--attr-' + c.attribute);
		}
		const stack = document.createElement('div');
		stack.className = 'card-face__stack';
		stack.setAttribute('aria-hidden', 'true');

		function pushLayer(classSuffix, url, fallback) {
			const im = document.createElement('img');
			im.className = 'card-face__layer-img card-face__layer-img--' + classSuffix;
			im.alt = '';
			im.src = staticUrl(url) || fallback || '';
			stack.appendChild(im);
		}

		pushLayer('base', c.layerBase, plateFbFull);
		// イラスト層は card-face フラグメントと同様、素材整備後に有効化
		// if (c.layerPortrait) {
		// 	pushLayer('portrait', c.layerPortrait, '');
		// }
		pushLayer('bar', c.layerBar, '');
		pushLayer('frame', c.layerFrame, dataFbFull);

		face.appendChild(stack);

		const datum = document.createElement('div');
		datum.className = 'card-face__layer card-face__datum';
		const costCls =
			'card-face__cost' +
			(c.cost === 1 ? ' card-face__cost--digit-1' : '') +
			(c.cost === 2 ? ' card-face__cost--digit-2' : '');
		datum.appendChild(elSpan(costCls, String(c.cost)));
		datum.appendChild(elSpan('card-face__power' + (c.power === 4 ? ' card-face__power--digit-4' : ''), String(c.power)));
		datum.appendChild(elSpan('card-face__name', c.name || ''));
		const attrLines = c.attrLines && c.attrLines.length ? c.attrLines : (c.attributeLabelJa ? [c.attributeLabelJa] : []);
		const attrWrap = document.createElement('span');
		attrWrap.className = 'card-face__attr-label' + (attrLines.length > 1 ? ' card-face__attr-label--compound' : '');
		attrLines.forEach(function (ln) {
			attrWrap.appendChild(elSpan('card-face__attr-line', ln));
		});
		datum.appendChild(attrWrap);
		face.appendChild(datum);

		return face;
	}

	function buildPreviewLayered(c) {
		const face = document.createElement('div');
		face.className = 'card-face card-face--layered';
		if (c.attribute) {
			face.classList.add('card-face--attr-' + c.attribute);
		}
		const stack = document.createElement('div');
		stack.className = 'card-face__stack';
		stack.setAttribute('aria-hidden', 'true');

		function pushLayer(classSuffix, url, fallback) {
			const im = document.createElement('img');
			im.className = 'card-face__layer-img card-face__layer-img--' + classSuffix;
			im.alt = '';
			im.src = staticUrl(url) || fallback || '';
			stack.appendChild(im);
		}

		pushLayer('base', c.layerBase, plateFbFull);
		// イラスト層は card-face フラグメントと同様、素材整備後に有効化
		// if (c.layerPortrait) {
		// 	pushLayer('portrait', c.layerPortrait, '');
		// }
		pushLayer('bar', c.layerBar, '');
		pushLayer('frame', c.layerFrame, dataFbFull);

		face.appendChild(stack);

		const datum = document.createElement('div');
		datum.className = 'card-face__layer card-face__datum';
		const costCls =
			'card-face__cost' +
			(c.cost === 1 ? ' card-face__cost--digit-1' : '') +
			(c.cost === 2 ? ' card-face__cost--digit-2' : '');
		datum.appendChild(elSpan(costCls, String(c.cost)));
		datum.appendChild(elSpan('card-face__power' + (c.power === 4 ? ' card-face__power--digit-4' : ''), String(c.power)));
		datum.appendChild(elSpan('card-face__name', c.name || ''));
		const attrLines = c.attrLines && c.attrLines.length ? c.attrLines : (c.attributeLabelJa ? [c.attributeLabelJa] : []);
		const attrWrap = document.createElement('span');
		attrWrap.className = 'card-face__attr-label' + (attrLines.length > 1 ? ' card-face__attr-label--compound' : '');
		attrLines.forEach(function (ln) {
			attrWrap.appendChild(elSpan('card-face__attr-line', ln));
		});
		datum.appendChild(attrWrap);
		face.appendChild(datum);

		return face;
	}

	function appendCardImage(parent, c) {
		if (c.layerBase || c.layerBar || c.layerFrame || c.layerPortrait) {
			parent.appendChild(buildMiniLayered(c));
			return;
		}
		if (c.img) {
			const im = document.createElement('img');
			im.src = c.img;
			im.alt = c.name;
			parent.appendChild(im);
			return;
		}
		const ph = document.createElement('div');
		ph.className = 'mini-card__no-art';
		ph.textContent = (c.name || '?').slice(0, 1);
		ph.title = c.name;
		parent.appendChild(ph);
	}

	/** ライブラリ一覧用：画像の下に枚数（×N） */
	function appendLibCardFace(parent, c) {
		appendCardImage(parent, c);
		const qty = document.createElement('span');
		qty.className = 'mini-card__qty';
		qty.textContent = '×' + c.qty;
		parent.appendChild(qty);
	}

	function bindPreview(el, c) {
		el.addEventListener('contextmenu', function (e) {
			e.preventDefault();
			if (previewFace) previewFace.innerHTML = '';

			if (c.layerBase || c.layerBar || c.layerFrame || c.layerPortrait) {
				if (previewImg) {
					previewImg.setAttribute('hidden', '');
					previewImg.removeAttribute('src');
					previewImg.alt = '';
				}
				if (previewFace) {
					previewFace.appendChild(buildPreviewLayered(c));
				}
			} else {
				const bigArt = c.img;
				if (bigArt && previewImg) {
					previewImg.removeAttribute('hidden');
					previewImg.src = bigArt;
					previewImg.alt = c.name;
				} else if (previewImg) {
					previewImg.removeAttribute('src');
					previewImg.setAttribute('hidden', '');
					previewImg.alt = '';
				}
			}
			preview.hidden = false;
		});
	}

	function fillDeckTooltipAbility(el, raw) {
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

	function positionTooltip(clientX, clientY) {
		const pad = 12;
		const tw = tooltipEl.offsetWidth;
		const th = tooltipEl.offsetHeight;
		let x = clientX + pad;
		let y = clientY + pad;
		if (x + tw > window.innerWidth - pad) {
			x = Math.max(pad, clientX - tw - pad);
		}
		if (y + th > window.innerHeight - pad) {
			y = Math.max(pad, window.innerHeight - th - pad);
		}
		tooltipEl.style.left = x + 'px';
		tooltipEl.style.top = y + 'px';
	}

	function showTooltip(c, clientX, clientY) {
		tooltipName.textContent = c.name;
		tooltipAttr.textContent = attributeLabelJa(c.attribute, c.attributeLabelJa) || '—';
		tooltipCost.textContent = String(c.cost);
		tooltipPower.textContent = String(c.power);
		fillDeckTooltipAbility(tooltipAbility, c.ability);
		tooltipEl.hidden = false;
		positionTooltip(clientX, clientY);
	}

	function hideTooltip() {
		tooltipEl.hidden = true;
	}

	function bindCardTooltip(el, c) {
		el.addEventListener('mouseenter', function (e) {
			showTooltip(c, e.clientX, e.clientY);
		});
		el.addEventListener('mousemove', function (e) {
			if (!tooltipEl.hidden) {
				positionTooltip(e.clientX, e.clientY);
			}
		});
		el.addEventListener('mouseleave', hideTooltip);
		el.addEventListener('blur', hideTooltip);
	}

	function refreshLib() {
		libZone.innerHTML = '';
		hideTooltip();
		if (deckZone.querySelectorAll('.mini-card').length >= 8) {
			return;
		}
		const list = sortedLibraryList();
		let added = 0;
		list.forEach(function (c) {
			const cap = maxPerForId(c.id);
			const inDeck = countInDeck(c.id);
			if (inDeck >= cap) return;
			const el = document.createElement('button');
			el.type = 'button';
			el.className = 'mini-card mini-card--lib';
			el.dataset.id = String(c.id);
			el.setAttribute('aria-label', c.name + '（強さ' + c.power + '・×' + c.qty + '）をデッキへ');
			appendLibCardFace(el, c);
			bindPreview(el, c);
			bindCardTooltip(el, c);
			el.addEventListener('click', function () {
				if (!canAddToDeck(c.id, cap)) return;
				const copy = document.createElement('div');
				copy.className = 'mini-card mini-card--deck';
				copy.dataset.id = String(c.id);
				copy.setAttribute('role', 'button');
				copy.setAttribute('tabindex', '0');
				copy.setAttribute('aria-label', c.name + 'をデッキから戻す');
				appendCardImage(copy, c);
				bindPreview(copy, c);
				bindCardTooltip(copy, c);
				copy.addEventListener('click', function () {
					copy.remove();
					refreshLib();
					update();
				});
				copy.addEventListener('keydown', function (ev) {
					if (ev.key === 'Enter' || ev.key === ' ') {
						ev.preventDefault();
						copy.click();
					}
				});
				deckZone.appendChild(copy);
				refreshLib();
				update();
			});
			libZone.appendChild(el);
			added++;
		});
		if (added === 0 && list.length === 0 && seeds.length > 0) {
			const hasSearch = libSearch && libSearch.value.trim();
			const hasAttr = libFilterAttr && libFilterAttr.value;
			const hasPow = libFilterPower && libFilterPower.value !== '';
			if (hasSearch || hasAttr || hasPow) {
				const p = document.createElement('p');
				p.className = 'muted deck-lib-empty-msg';
				p.textContent = '表示条件に一致するカードがありません。';
				libZone.appendChild(p);
			}
		}
	}

	function update() {
		const n = deckZone.querySelectorAll('.mini-card').length;
		deckCount.textContent = n + ' / 8';
		completeBtn.style.display = n === 8 ? '' : 'none';
		const ids = Array.from(deckZone.querySelectorAll('.mini-card')).map(function (x) { return x.dataset.id; });
		cardIdsInput.value = ids.join(',');
	}

	function bootstrapDeck() {
		initialDeck.forEach(function (id) {
			const c = seeds.find(function (s) { return s.id === id; });
			if (!c) return;
			const cap = maxPerForId(id);
			if (!canAddToDeck(id, cap)) return;
			const copy = document.createElement('div');
			copy.className = 'mini-card mini-card--deck';
			copy.dataset.id = String(id);
			copy.setAttribute('role', 'button');
			copy.setAttribute('tabindex', '0');
			copy.setAttribute('aria-label', c.name + 'をデッキから戻す');
			appendCardImage(copy, c);
			bindPreview(copy, c);
			bindCardTooltip(copy, c);
			copy.addEventListener('click', function () {
				copy.remove();
				refreshLib();
				update();
			});
			copy.addEventListener('keydown', function (ev) {
				if (ev.key === 'Enter' || ev.key === ' ') {
					ev.preventDefault();
					copy.click();
				}
			});
			deckZone.appendChild(copy);
		});
	}

	function onFilterChange() {
		refreshLib();
	}

	if (libSearch) {
		libSearch.addEventListener('input', onFilterChange);
	}
	if (libSort) {
		libSort.addEventListener('change', onFilterChange);
	}
	if (libFilterAttr) {
		libFilterAttr.addEventListener('change', onFilterChange);
	}
	if (libFilterPower) {
		libFilterPower.addEventListener('change', onFilterChange);
	}

	document.addEventListener('scroll', hideTooltip, true);
	window.addEventListener('blur', hideTooltip);

	bootstrapDeck();
	refreshLib();
	update();
})();
