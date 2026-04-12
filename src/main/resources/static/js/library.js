(function () {
	const contextPath = document.querySelector('meta[name="nine_universe_context_path"]')?.getAttribute('content') || '';
	const plateFbFull = document.querySelector('meta[name="card_plate_fallback"]')?.getAttribute('content') || '';
	const dataFbFull = document.querySelector('meta[name="card_data_fallback"]')?.getAttribute('content') || '';
	function staticUrl(path) {
		if (path == null || path === '') return '';
		const p = String(path);
		if (p.startsWith('http://') || p.startsWith('https://')) return p;
		return contextPath + p;
	}

	const modal = document.getElementById('library-detail-modal');
	const artWrap = modal ? document.getElementById('library-detail-art') : null;
	const modalLayerBase = document.getElementById('lib-modal-layer-base');
	const modalLayerPortrait = document.getElementById('lib-modal-layer-portrait');
	const modalLayerBar = document.getElementById('lib-modal-layer-bar');
	const modalLayerFrame = document.getElementById('lib-modal-layer-frame');
	const modalCost = document.getElementById('lib-modal-cost');
	const modalPower = document.getElementById('lib-modal-power');
	const modalName = document.getElementById('lib-modal-name');
	const modalAttr = document.getElementById('lib-modal-attr');
	const modalAbility = document.getElementById('lib-modal-ability');
	const sideTitle = document.getElementById('lib-modal-side-title');
	const sideAttr = document.getElementById('lib-modal-side-attr');
	const sideCost = document.getElementById('lib-modal-side-cost');
	const sidePower = document.getElementById('lib-modal-side-power');
	const sideRarity = document.getElementById('lib-modal-side-rarity');
	const sideAbility = document.getElementById('lib-modal-side-ability');

	const tooltipEl = document.getElementById('library-tooltip');
	const tooltipName = tooltipEl ? tooltipEl.querySelector('.deck-tooltip__name') : null;
	const tooltipAttr = tooltipEl ? tooltipEl.querySelector('.deck-tooltip__attr') : null;
	const tooltipCost = tooltipEl ? tooltipEl.querySelector('.deck-tooltip__cost') : null;
	const tooltipPower = tooltipEl ? tooltipEl.querySelector('.deck-tooltip__power') : null;
	const tooltipAbility = tooltipEl ? tooltipEl.querySelector('.deck-tooltip__ability') : null;
	const tooltipRarity = tooltipEl ? tooltipEl.querySelector('.deck-tooltip__rarity') : null;

	const ATTR_JA = {
		HUMAN: '人間',
		ELF: 'エルフ',
		UNDEAD: 'アンデッド',
		DRAGON: 'ドラゴン'
	};

	function hideBrokenImg(img) {
		if (!img) return;
		img.setAttribute('hidden', '');
		img.removeAttribute('src');
	}

	function applyOnceImgFallback(img, fallbackSrc) {
		if (!img) return;
		if (img.dataset && img.dataset.fallbackWired === 'true') return;
		if (img.dataset) img.dataset.fallbackWired = 'true';
		function handleError() {
			// fallback は「1回だけ」試す。fallback も失敗したら壊れアイコンを残さず非表示にする。
			if (fallbackSrc && img.dataset && img.dataset.fallbackTried !== 'true') {
				img.dataset.fallbackTried = 'true';
				img.src = fallbackSrc;
				return;
			}
			hideBrokenImg(img);
		}
		img.addEventListener('error', handleError);
		function crushIfAlreadyBroken() {
			try {
				if (img.complete && img.naturalWidth === 0) {
					handleError();
				}
			} catch (e) {
				// noop
			}
		}
		// ハンドラ登録前に壊れていた場合
		crushIfAlreadyBroken();
		// ブラウザによっては error イベントが取りこぼされることがあるため、
		// 直後と少し後にも再チェックして壊れアイコンの取り残しを防ぐ。
		setTimeout(crushIfAlreadyBroken, 0);
		setTimeout(crushIfAlreadyBroken, 250);
	}

	function hideHoverTooltip() {
		if (tooltipEl) {
			tooltipEl.hidden = true;
			tooltipEl.classList.remove('deck-tooltip--wide-attr');
		}
		if (tooltipAttr) tooltipAttr.classList.remove('deck-tooltip__attr--oneline');
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

	function positionHoverTooltip(clientX, clientY) {
		if (!tooltipEl) return;
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

	function tooltipAttributeDisplay(d) {
		const pipe = d.attrPipe || '';
		if (pipe) {
			const parts = pipe.split('|').filter(Boolean);
			if (parts.length > 1) return parts.join('/');
			if (parts.length === 1) return parts[0];
		}
		const attr = d.attribute || '';
		if (attr.indexOf('_') !== -1) {
			return attr.split('_').map(function (seg) {
				return ATTR_JA[seg] || seg;
			}).join('/');
		}
		return d.attributeJa || ATTR_JA[attr] || attr || '—';
	}

	function tooltipAttributeIsCompound(d) {
		const pipe = d.attrPipe || '';
		if (pipe.split('|').filter(Boolean).length > 1) return true;
		const attr = d.attribute || '';
		return attr.indexOf('_') !== -1;
	}

	function showHoverTooltip(btn, clientX, clientY) {
		if (!tooltipEl || !tooltipName) return;
		const d = btn.dataset;
		const owned = d.owned === 'true';
		tooltipName.textContent = owned ? (d.name || '') : '？？？？';
		const compound = tooltipAttributeIsCompound(d);
		if (tooltipEl.classList) tooltipEl.classList.toggle('deck-tooltip--wide-attr', compound);
		if (tooltipAttr) {
			tooltipAttr.textContent = tooltipAttributeDisplay(d);
			tooltipAttr.classList.toggle('deck-tooltip__attr--oneline', compound);
		}
		if (tooltipCost) tooltipCost.textContent = owned && d.cost != null && d.cost !== '' ? String(d.cost) : '—';
		if (tooltipPower) tooltipPower.textContent = owned && d.basePower != null && d.basePower !== '' ? String(d.basePower) : '—';
		if (tooltipRarity) tooltipRarity.textContent = owned ? (d.rarityLabel || d.rarity || 'C') : '—';
		if (tooltipAbility) fillDeckTooltipAbility(tooltipAbility, owned ? d.ability : '');
		tooltipEl.hidden = false;
		positionHoverTooltip(clientX, clientY);
	}

	function bindHoverTooltip(cardEl, btn) {
		if (!tooltipEl) return;
		// `.library-card` の外枠にイベントを付けると、ブラウザ差やDOM入れ替えで発火が不安定になるため、
		// 実際のホバー対象（ボタン）に付ける。
		const target = btn || cardEl;
		target.addEventListener('pointerenter', function (e) {
			showHoverTooltip(btn, e.clientX, e.clientY);
		});
		target.addEventListener('pointermove', function (e) {
			if (!tooltipEl.hidden) positionHoverTooltip(e.clientX, e.clientY);
		});
		target.addEventListener('pointerleave', hideHoverTooltip);
	}

	function buildAbilityBlocksFromCanonical(line) {
		if (!line) {
			return [{ h: '', b: '効果なし。' }];
		}
		let s = line.startsWith('・') ? line.slice(1) : line;
		if (s.indexOf('/効果なし。') !== -1 || s.indexOf('/能力なし。') !== -1) {
			return [{ h: '', b: '効果なし。' }];
		}
		let idx = s.indexOf('/配置：');
		if (idx >= 0) {
			return [{ h: '〈配置〉', b: s.slice(idx + '/配置：'.length) }];
		}
		idx = s.indexOf('/配置:');
		if (idx >= 0) {
			return [{ h: '〈配置〉', b: s.slice(idx + '/配置:'.length) }];
		}
		idx = s.indexOf('/常時：');
		if (idx >= 0) {
			return [{ h: '〈常時〉', b: s.slice(idx + '/常時：'.length) }];
		}
		idx = s.indexOf('/常時:');
		if (idx >= 0) {
			return [{ h: '〈常時〉', b: s.slice(idx + '/常時:'.length) }];
		}
		return [{ h: '', b: s }];
	}

	function rarityLabelJa(code, label) {
		const l = (label || '').trim();
		if (
			l === 'レジェンダリー' ||
			l === 'エピック' ||
			l === 'レア' ||
			l === 'コモン'
		) {
			return l;
		}
		const c = (code || '').trim();
		if (c === 'Reg') return 'レジェンダリー';
		if (c === 'Ep') return 'エピック';
		if (c === 'R') return 'レア';
		return 'コモン';
	}

	function rarityCode4(code) {
		const c = (code || 'C').trim();
		if (c === 'Reg' || c === 'Ep' || c === 'R' || c === 'C') return c;
		// 予期しない値はコモン扱い
		return 'C';
	}

	function openModal(btn) {
		hideHoverTooltip();
		if (!modal || !modalCost || !modalAbility) return;
		const d = btn.dataset;
		const owned = d.owned === 'true';
		if (!owned) return;

		const rarity = rarityCode4(d.rarity);
		const rarityLabel = rarityLabelJa(rarity, d.rarityLabel || rarity || 'C');
		const modalFaceRoot = document.getElementById('library-modal-card-face');
		const modalRarity = document.getElementById('lib-modal-rarity');
		const modalSpark = document.getElementById('lib-modal-spark');

		if (modalFaceRoot) {
			modalFaceRoot.classList.remove('card-face--rarity-C', 'card-face--rarity-R', 'card-face--rarity-Ep', 'card-face--rarity-Reg');
			modalFaceRoot.classList.add('card-face--rarity-' + rarity);
		}
		if (modalRarity) {
			// カード面の表示はコード（Reg/Ep/R/C）
			modalRarity.textContent = rarity;
		}
		if (sideRarity) {
			sideRarity.textContent = rarityLabel;
		}

		if (modalCost) {
			modalCost.textContent = d.cost != null && d.cost !== '' ? String(d.cost) : '';
			const cn = parseInt(d.cost, 10);
			modalCost.className = 'card-face__cost';
			if (cn === 1) modalCost.classList.add('card-face__cost--digit-1');
			if (cn === 2) modalCost.classList.add('card-face__cost--digit-2');
		}
		if (modalPower) {
			modalPower.textContent = d.basePower != null && d.basePower !== '' ? String(d.basePower) : '';
			const pn = parseInt(d.basePower, 10);
			modalPower.className = 'card-face__power';
			if (pn === 4) modalPower.classList.add('card-face__power--digit-4');
		}
		if (modalName) modalName.textContent = d.name || '';
		if (sideTitle) sideTitle.textContent = d.name || '';
		if (sideCost) sideCost.textContent = d.cost != null && d.cost !== '' ? String(d.cost) : '—';
		if (sidePower) sidePower.textContent = d.basePower != null && d.basePower !== '' ? String(d.basePower) : '—';
		if (modalAttr) {
			const pipe = (d.attrPipe || '').trim();
			let lines = pipe ? pipe.split('|').filter(Boolean) : [];
			// data-attr-pipe が取れない（古いHTML/キャッシュ等）場合のフォールバック
			// 例: attribute = "ELF_UNDEAD" → ["エルフ","アンデッド"]
			if (lines.length <= 1) {
				const code = (d.attribute || '').trim();
				if (code.indexOf('_') !== -1) {
					lines = code.split('_').map(function (seg) {
						return ATTR_JA[seg] || seg;
					}).filter(Boolean);
				}
			}
			if (lines.length > 1) {
				// カード面と同じ2行レイアウト（左上/左下）に合わせる
				modalAttr.className = 'card-face__attr-label card-face__attr-label--compound';
				modalAttr.innerHTML = '';
				lines.forEach(function (ln) {
					const s = document.createElement('span');
					s.className = 'card-face__attr-line';
					s.textContent = ln;
					modalAttr.appendChild(s);
				});
			} else {
				modalAttr.className = 'card-face__attr-label';
				modalAttr.textContent = d.attributeJa || ATTR_JA[d.attribute] || d.attribute || '';
			}
		}
		if (sideAttr) {
			sideAttr.textContent = tooltipAttributeDisplay(d);
		}

		modalAbility.innerHTML = '';
		const blocks = buildAbilityBlocksFromCanonical(d.canonicalLine);
		blocks.forEach(function (bl) {
			if (bl.h) {
				const ph = document.createElement('p');
				ph.className = 'card-face__ability-head';
				ph.textContent = bl.h;
				modalAbility.appendChild(ph);
			}
			const pb = document.createElement('p');
			pb.className = 'card-face__ability-body';
			pb.textContent = bl.b;
			modalAbility.appendChild(pb);
		});
		if (sideAbility) {
			// 右側テキスト用（見出し付きのブロックを1つの文章にまとめる）
			const t = blocks.map(function (b) {
				return b.h ? (b.h + '\n' + b.b) : b.b;
			}).join('\n\n');
			sideAbility.textContent = t || '—';
		}

		if (artWrap) {
			artWrap.classList.toggle('library-detail-modal__art-wrap--locked', !owned);
		}

		if (modalLayerBase) {
			applyOnceImgFallback(modalLayerBase, plateFbFull);
			modalLayerBase.removeAttribute('hidden');
			modalLayerBase.src = staticUrl(d.layerBase) || plateFbFull;
		}
		if (modalLayerPortrait) {
			applyOnceImgFallback(modalLayerPortrait, '');
			const pu = staticUrl(d.layerPortrait);
			if (pu) {
				modalLayerPortrait.removeAttribute('hidden');
				modalLayerPortrait.src = pu;
			} else {
				hideBrokenImg(modalLayerPortrait);
			}
		}
		if (modalLayerBar) {
			applyOnceImgFallback(modalLayerBar, '');
			const bu = staticUrl(d.layerBar);
			if (bu) {
				modalLayerBar.removeAttribute('hidden');
				modalLayerBar.src = bu;
			} else {
				hideBrokenImg(modalLayerBar);
			}
		}
		if (modalLayerFrame) {
			applyOnceImgFallback(modalLayerFrame, dataFbFull);
			modalLayerFrame.removeAttribute('hidden');
			modalLayerFrame.src = staticUrl(d.layerFrame) || dataFbFull;
		}

		modal.hidden = false;
		document.body.style.overflow = 'hidden';

		if (modalSpark && typeof fillContinuousCardSpark === 'function') {
			fillContinuousCardSpark(modalSpark, rarity);
		}
	}

	function closeModal() {
		hideHoverTooltip();
		if (!modal) return;
		const modalSpark = document.getElementById('lib-modal-spark');
		if (modalSpark) {
			modalSpark.hidden = true;
			modalSpark.classList.remove('is-on', 'card-spark--continuous', 'spark--R', 'spark--Ep', 'spark--Reg');
			modalSpark.textContent = '';
		}
		modal.hidden = true;
		document.body.style.overflow = '';
	}

	function wireCardFaceImgFallbacks(rootEl) {
		if (!rootEl) return;
		const base = rootEl.querySelector('img.card-face__layer-img--base');
		const frame = rootEl.querySelector('img.card-face__layer-img--frame');
		const portrait = rootEl.querySelector('img.card-face__layer-img--portrait');
		const bar = rootEl.querySelector('img.card-face__layer-img--bar');

		applyOnceImgFallback(base, plateFbFull);
		applyOnceImgFallback(frame, dataFbFull);
		applyOnceImgFallback(portrait, '');
		applyOnceImgFallback(bar, '');
	}

	document.querySelectorAll('.library-card').forEach(function (card) {
		const btn = card.querySelector('.library-card__open');
		if (!btn) return;
		// 一覧側のレイヤー画像も、読み込み失敗時に壊れアイコンが出ないようにする
		wireCardFaceImgFallbacks(card);
		bindHoverTooltip(card, btn);
		btn.addEventListener('click', function () {
			openModal(btn);
		});

		const rarity = (btn.dataset.rarity || 'C').trim();
		const owned = btn.dataset.owned === 'true';
		if (owned && rarity !== 'C' && typeof fillContinuousCardSpark === 'function') {
			const spark = card.querySelector('.card-face .card-spark');
			if (spark) {
				fillContinuousCardSpark(spark, rarity);
			}
		}
	});

	document.addEventListener('scroll', hideHoverTooltip, true);
	window.addEventListener('blur', hideHoverTooltip);

	if (modal) {
		modal.addEventListener('click', function (e) {
			if (e.target === modal) closeModal();
		});

		modal.querySelectorAll('[data-library-detail-close]').forEach(function (el) {
			el.addEventListener('click', closeModal);
		});

		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && !modal.hidden) closeModal();
		});
	}

	const grid = document.getElementById('library-all-grid');
	const searchInput = document.getElementById('library-search');
	const filterAttr = document.getElementById('library-filter-attr');
	const filterCost = document.getElementById('library-filter-cost');
	const filterPower = document.getElementById('library-filter-power');
	const filterRarity = document.getElementById('library-filter-rarity');
	const emptyMsg = document.getElementById('library-empty-msg');

	if (grid && searchInput && filterAttr && filterCost && filterPower && filterRarity) {
		const ATTR_ORDER = { HUMAN: 0, ELF: 1, UNDEAD: 2, DRAGON: 3 };
		const cards = Array.from(grid.children).filter(function (el) {
			return el.classList && el.classList.contains('library-card');
		});

		function primaryAttrSeg(code) {
			if (!code) return '';
			const i = code.indexOf('_');
			return i === -1 ? code : code.substring(0, i);
		}

		function matchesTribeFilter(cardAttr, filterVal) {
			if (!filterVal) return true;
			if (!cardAttr) return false;
			if (cardAttr === filterVal) return true;
			return cardAttr.split('_').indexOf(filterVal) !== -1;
		}

		function cmpAttr(a, b) {
			const ao = ATTR_ORDER[primaryAttrSeg(a.attribute)] !== undefined ? ATTR_ORDER[primaryAttrSeg(a.attribute)] : 99;
			const bo = ATTR_ORDER[primaryAttrSeg(b.attribute)] !== undefined ? ATTR_ORDER[primaryAttrSeg(b.attribute)] : 99;
			return ao - bo;
		}

		function cmpPower(a, b) {
			return a.power - b.power;
		}

		function cmpCost(a, b) {
			return a.cost - b.cost;
		}

		function cmpName(a, b) {
			return a.name.localeCompare(b.name, 'ja');
		}

		function matchesCardTextSearch(q, parts) {
			if (!q) return true;
			for (let i = 0; i < parts.length; i++) {
				const s = parts[i];
				if (s != null && s !== '' && String(s).indexOf(q) !== -1) return true;
			}
			return false;
		}

		function applyBrowser() {
			const q = searchInput.value.trim();
			const attrSel = filterAttr.value;
			const costSel = filterCost.value;
			const powerSel = filterPower.value;
			const raritySel = filterRarity.value;
			let items = cards.map(function (card) {
				const btn = card.querySelector('.library-card__open');
				const ds = btn ? btn.dataset : {};
				const p = parseInt(ds.basePower, 10);
				const c = parseInt(ds.cost, 10);
				return {
					card: card,
					name: ds.name || '',
					owned: ds.owned === 'true',
					attribute: ds.attribute || '',
					power: isNaN(p) ? 0 : p,
					cost: isNaN(c) ? 0 : c,
					rarity: (ds.rarity || 'C').trim(),
					searchParts: [
						ds.name,
						ds.ability,
						ds.canonicalLine,
						ds.deployHelp,
						ds.passiveHelp
					]
				};
			});
			items = items.filter(function (it) {
				// テキスト検索時のみ未所持はヒットさせない（絞り込み・並びは従来どおり全カード対象）
				if (q && !it.owned) return false;
				if (!matchesCardTextSearch(q, it.searchParts)) return false;
				if (attrSel && !matchesTribeFilter(it.attribute, attrSel)) return false;
				if (costSel && String(it.cost) !== String(costSel)) return false;
				if (powerSel && String(it.power) !== String(powerSel)) return false;
				if (raritySel && it.rarity !== raritySel) return false;
				return true;
			});
			items.sort(function (a, b) {
				let r = cmpCost(a, b);
				if (r !== 0) return r;
				r = cmpAttr(a, b);
				if (r !== 0) return r;
				r = cmpPower(a, b);
				if (r !== 0) return r;
				return cmpName(a, b);
			});

			cards.forEach(function (c) {
				c.style.display = 'none';
			});
			items.forEach(function (it) {
				it.card.style.display = '';
				grid.appendChild(it.card);
			});

			if (emptyMsg) {
				emptyMsg.hidden = items.length > 0;
			}
		}

		searchInput.addEventListener('input', applyBrowser);
		filterAttr.addEventListener('change', applyBrowser);
		filterCost.addEventListener('change', applyBrowser);
		filterPower.addEventListener('change', applyBrowser);
		filterRarity.addEventListener('change', applyBrowser);
		applyBrowser();
	}
})();
