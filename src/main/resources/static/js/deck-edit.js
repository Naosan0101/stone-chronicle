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

	const libZone = document.getElementById('lib-zone');
	const deckZone = document.getElementById('deck-zone');
	const deckCount = document.getElementById('deck-count');
	const completeBtn = document.getElementById('complete-btn');
	const clearAllDeckBtn = document.getElementById('deck-clear-all-btn');
	const cardIdsInput = document.getElementById('cardIds');
	const detailModal = document.getElementById('library-detail-modal');
	const detailArtWrap = document.getElementById('library-detail-art');
	const modalLayerBase = document.getElementById('lib-modal-layer-base');
	const modalLayerPortrait = document.getElementById('lib-modal-layer-portrait');
	const modalLayerBar = document.getElementById('lib-modal-layer-bar');
	const modalLayerFrame = document.getElementById('lib-modal-layer-frame');
	const modalCost = document.getElementById('lib-modal-cost');
	const modalPower = document.getElementById('lib-modal-power');
	const modalName = document.getElementById('lib-modal-name');
	const modalAttr = document.getElementById('lib-modal-attr');
	const modalRarity = document.getElementById('lib-modal-rarity');
	const modalAbility = document.getElementById('lib-modal-ability');
	const sideTitle = document.getElementById('lib-modal-side-title');
	const sideAttr = document.getElementById('lib-modal-side-attr');
	const sideCost = document.getElementById('lib-modal-side-cost');
	const sidePower = document.getElementById('lib-modal-side-power');
	const sideRarity = document.getElementById('lib-modal-side-rarity');
	const sideAbility = document.getElementById('lib-modal-side-ability');
	const libSearch = document.getElementById('lib-search');
	const libSort = document.getElementById('lib-sort');
	const libFilterAttr = document.getElementById('lib-filter-attr');
	const libFilterPower = document.getElementById('lib-filter-power');
	const libFilterCost = document.getElementById('lib-filter-cost');
	const libFilterRarity = document.getElementById('lib-filter-rarity');
	const tooltipEl = document.getElementById('deck-tooltip');
	const tooltipName = tooltipEl.querySelector('.deck-tooltip__name');
	const tooltipAttr = tooltipEl.querySelector('.deck-tooltip__attr');
	const tooltipCost = tooltipEl.querySelector('.deck-tooltip__cost');
	const tooltipPower = tooltipEl.querySelector('.deck-tooltip__power');
	const tooltipAbility = tooltipEl.querySelector('.deck-tooltip__ability');

	const ATTR_LABEL = { HUMAN: '人間', ELF: 'エルフ', UNDEAD: 'アンデッド', DRAGON: 'ドラゴン' };
	const RARITY_LABEL = { Reg: 'レジェンダリー', Ep: 'エピック', R: 'レア', C: 'コモン' };

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
		crushIfAlreadyBroken();
		setTimeout(crushIfAlreadyBroken, 0);
		setTimeout(crushIfAlreadyBroken, 250);
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
		const c = (code || 'C').trim();
		return RARITY_LABEL[c] || 'コモン';
	}

	function rarityCode4(code) {
		const c = (code || 'C').trim();
		if (c === 'Reg' || c === 'Ep' || c === 'R' || c === 'C') return c;
		return 'C';
	}

	function closeCardDetailModal() {
		hideTooltip();
		if (!detailModal) return;
		const modalSpark = document.getElementById('lib-modal-spark');
		if (modalSpark) {
			modalSpark.hidden = true;
			modalSpark.classList.remove('is-on', 'card-spark--continuous', 'spark--R', 'spark--Ep', 'spark--Reg');
			modalSpark.textContent = '';
		}
		detailModal.hidden = true;
		document.body.style.overflow = '';
	}

	function openCardDetailModal(c) {
		hideTooltip();
		if (!detailModal || !modalCost || !modalAbility) return;

		const rarity = rarityCode4(c.rarity);
		const rarityLabel = rarityLabelJa(rarity, c.rarityLabel || rarity || 'C');
		const modalFaceRoot = document.getElementById('library-modal-card-face');
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
			modalCost.textContent = c.cost != null && c.cost !== '' ? String(c.cost) : '';
			const cn = parseInt(c.cost, 10);
			modalCost.className = 'card-face__cost';
			if (cn === 1) modalCost.classList.add('card-face__cost--digit-1');
			if (cn === 2) modalCost.classList.add('card-face__cost--digit-2');
		}
		if (modalPower) {
			modalPower.textContent = c.power != null && c.power !== '' ? String(c.power) : '';
			const pn = parseInt(c.power, 10);
			modalPower.className = 'card-face__power';
			if (pn === 4) modalPower.classList.add('card-face__power--digit-4');
		}
		if (modalName) modalName.textContent = c.name || '';
		if (sideTitle) sideTitle.textContent = c.name || '';
		if (sideCost) sideCost.textContent = c.cost != null && c.cost !== '' ? String(c.cost) : '—';
		if (sidePower) sidePower.textContent = c.power != null && c.power !== '' ? String(c.power) : '—';

		if (modalAttr) {
			const pipe = (c.attrPipe || '').trim();
			let lines = pipe ? pipe.split('|').filter(Boolean) : [];
			if (lines.length <= 1) {
				const code = (c.attribute || '').trim();
				if (code.indexOf('_') !== -1) {
					lines = code.split('_').map(function (seg) {
						return ATTR_LABEL[seg] || seg;
					}).filter(Boolean);
				}
			}
			if (lines.length > 1) {
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
				modalAttr.textContent = c.attributeLabelJa || ATTR_LABEL[c.attribute] || c.attribute || '';
			}
		}
		if (sideAttr) {
			sideAttr.textContent = deckEditTooltipAttribute(c);
		}

		modalAbility.innerHTML = '';
		const blocks = buildAbilityBlocksFromCanonical(c.canonicalLine);
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
			const t = blocks.map(function (b) {
				return b.h ? (b.h + '\n' + b.b) : b.b;
			}).join('\n\n');
			sideAbility.textContent = t || '—';
		}

		if (detailArtWrap) {
			detailArtWrap.classList.remove('library-detail-modal__art-wrap--locked');
		}

		if (modalLayerBase) {
			applyOnceImgFallback(modalLayerBase, plateFbFull);
			modalLayerBase.removeAttribute('hidden');
			modalLayerBase.src = staticUrl(c.layerBase) || plateFbFull;
		}
		if (modalLayerPortrait) {
			applyOnceImgFallback(modalLayerPortrait, '');
			const pu = staticUrl(c.layerPortrait);
			if (pu) {
				modalLayerPortrait.removeAttribute('hidden');
				modalLayerPortrait.src = pu;
			} else {
				hideBrokenImg(modalLayerPortrait);
			}
		}
		if (modalLayerBar) {
			applyOnceImgFallback(modalLayerBar, '');
			const bu = staticUrl(c.layerBar);
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
			modalLayerFrame.src = staticUrl(c.layerFrame) || dataFbFull;
		}

		detailModal.hidden = false;
		document.body.style.overflow = 'hidden';

		if (modalSpark && typeof fillContinuousCardSpark === 'function') {
			fillContinuousCardSpark(modalSpark, rarity);
		}
	}


	function applyContinuousSparkToFaceRoot(faceRoot, rarityCode) {
		if (!faceRoot || typeof fillContinuousCardSpark !== 'function') return;
		const r = (rarityCode || 'C').trim();
		if (r === 'C') return;
		const spark = faceRoot.querySelector('.card-spark');
		if (spark) {
			fillContinuousCardSpark(spark, r);
		}
	}

	function wireSparkOnMiniCardHost(hostEl, c) {
		if (!hostEl || !c) return;
		const face = hostEl.querySelector('.card-face--layered');
		if (face) {
			applyContinuousSparkToFaceRoot(face, c.rarity);
		}
	}

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

	/** ホバー詳細: 複合種族は「エルフ/アンデッド」形式で一行 */
	function deckEditTooltipAttribute(c) {
		if (c.attrLines && c.attrLines.length >= 2) {
			return c.attrLines.join('/');
		}
		if (c.attrLines && c.attrLines.length === 1) {
			return c.attrLines[0];
		}
		const code = c.attribute || '';
		if (code.indexOf('_') !== -1) {
			return code.split('_').map(function (seg) {
				return ATTR_LABEL[seg] || seg;
			}).join('/');
		}
		return attributeLabelJa(c.attribute, c.attributeLabelJa) || '—';
	}

	function deckEditTooltipAttributeIsCompound(c) {
		if (c.attrLines && c.attrLines.length >= 2) return true;
		const code = c.attribute || '';
		return code.indexOf('_') !== -1;
	}

	/** デッキへの追加／デッキからの削除はダブルクリック・右クリック。キーボードは約0.5秒以内に2回 Enter または Space */
	function bindDeckDoubleAction(el, handler) {
		let lastKeyTs = 0;
		el.addEventListener('dblclick', function (e) {
			e.preventDefault();
			handler();
		});
		el.addEventListener('keydown', function (ev) {
			if (ev.key !== 'Enter' && ev.key !== ' ') return;
			ev.preventDefault();
			const now = Date.now();
			if (lastKeyTs && now - lastKeyTs < 520) {
				lastKeyTs = 0;
				handler();
			} else {
				lastKeyTs = now;
			}
		});
	}

	function bindDeckContextMenu(el, handler) {
		el.addEventListener('contextmenu', function (e) {
			e.preventDefault();
			handler();
		});
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
			rarity: (el.dataset.rarity || 'C').trim(),
			rarityLabel: (el.dataset.rarityLabel || '').trim(),
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
			ability: el.dataset.ability || '',
			canonicalLine: el.dataset.canonicalLine || '',
			deployHelp: el.dataset.deployHelp || '',
			passiveHelp: el.dataset.passiveHelp || '',
			attrPipe: el.dataset.attrPipe || ''
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

	function sortedLibraryList() {
		const q = libSearch ? libSearch.value.trim() : '';
		const attrF = libFilterAttr ? libFilterAttr.value : '';
		const powF = libFilterPower ? libFilterPower.value : '';
		const costF = libFilterCost ? libFilterCost.value : '';
		const rarF = libFilterRarity ? libFilterRarity.value : '';
		let list = seeds.filter(function (c) {
			if (
				!matchesCardTextSearch(q, [
					c.name,
					c.ability,
					c.canonicalLine,
					c.deployHelp,
					c.passiveHelp
				])
			) {
				return false;
			}
			if (attrF && !matchesTribeFilter(c.attribute, attrF)) return false;
			if (powF !== '' && c.power !== parseInt(powF, 10)) return false;
			if (costF !== '' && c.cost !== parseInt(costF, 10)) return false;
			if (rarF && c.rarity !== rarF) return false;
			return true;
		});
		const mode = libSort ? libSort.value : 'cost_asc';
		list = list.slice();
		list.sort(function (a, b) {
			let r;
			if (mode === 'cost_desc') {
				r = cmpCost(b, a);
			} else {
				r = cmpCost(a, b);
			}
			if (r !== 0) return r;
			r = cmpPower(a, b);
			if (r !== 0) return r;
			return cmpName(a, b);
		});
		return list;
	}

	function buildMiniLayered(c) {
		if (typeof buildLibraryCardFace !== 'function') {
			const ph = document.createElement('div');
			ph.className = 'mini-card__no-art';
			ph.textContent = (c.name || '?').slice(0, 1);
			return ph;
		}
		const face = buildLibraryCardFace(
			{
				layerBase: c.layerBase,
				layerPortrait: c.layerPortrait,
				layerBar: c.layerBar,
				layerFrame: c.layerFrame,
				attribute: c.attribute,
				rarity: c.rarity,
				rarityLabel: c.rarityLabel || c.rarity || 'C',
				cost: c.cost,
				power: c.power,
				name: c.name,
				attrLines: c.attrLines,
				attributeLabelJa: c.attributeLabelJa,
				ability: c.ability
			},
			{
				contextPath: contextPath,
				plateFallback: plateFbFull,
				dataFallback: dataFbFull,
				extraRootClasses: 'card-face--mini-deck'
			}
		);
		wireLibraryCardFaceImages(face, plateFbFull, dataFbFull);
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

	/** シングルクリックで詳細モーダル（ライブラリページと同じ `#library-detail-modal`）。ダブルクリック操作と競合しないよう遅延＋キャンセル */
	let pendingCardDetailTimer = null;
	function bindClickOpenCardDetail(el, c) {
		el.addEventListener('click', function (e) {
			if (e.detail >= 2) {
				if (pendingCardDetailTimer) {
					clearTimeout(pendingCardDetailTimer);
					pendingCardDetailTimer = null;
				}
				return;
			}
			if (pendingCardDetailTimer) clearTimeout(pendingCardDetailTimer);
			pendingCardDetailTimer = setTimeout(function () {
				pendingCardDetailTimer = null;
				openCardDetailModal(c);
			}, 280);
		});
		el.addEventListener('dblclick', function () {
			if (pendingCardDetailTimer) {
				clearTimeout(pendingCardDetailTimer);
				pendingCardDetailTimer = null;
			}
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
		const compound = deckEditTooltipAttributeIsCompound(c);
		tooltipEl.classList.toggle('deck-tooltip--wide-attr', compound);
		tooltipAttr.textContent = deckEditTooltipAttribute(c);
		tooltipAttr.classList.toggle('deck-tooltip__attr--oneline', compound);
		tooltipCost.textContent = String(c.cost);
		tooltipPower.textContent = String(c.power);
		fillDeckTooltipAbility(tooltipAbility, c.ability);
		tooltipEl.hidden = false;
		positionTooltip(clientX, clientY);
	}

	function hideTooltip() {
		tooltipEl.hidden = true;
		tooltipEl.classList.remove('deck-tooltip--wide-attr');
		tooltipAttr.classList.remove('deck-tooltip__attr--oneline');
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
		const list = sortedLibraryList();
		let added = 0;
		list.forEach(function (c) {
			const cap = maxPerForId(c.id);
			const inDeck = countInDeck(c.id);
			const el = document.createElement('button');
			el.type = 'button';
			var deckCls = '';
			if (inDeck === 1) deckCls = ' mini-card--deck-1';
			else if (inDeck >= 2) deckCls = ' mini-card--deck-2';
			el.className = 'mini-card mini-card--lib' + deckCls;
			el.dataset.id = String(c.id);
			const inDeckHint = inDeck > 0 ? '。デッキに' + inDeck + '枚使用中' : '';
			el.setAttribute(
				'aria-label',
				c.name +
					'（強さ' +
					c.power +
					'・×' +
					c.qty +
					inDeckHint +
					'）。クリックで詳細、ダブルクリックまたは右クリックでデッキへ'
			);
			appendLibCardFace(el, c);
			wireSparkOnMiniCardHost(el, c);
			bindClickOpenCardDetail(el, c);
			bindCardTooltip(el, c);
			const addToDeck = function () {
				if (!canAddToDeck(c.id, cap)) return;
				const copy = document.createElement('div');
				copy.className = 'mini-card mini-card--deck';
				copy.dataset.id = String(c.id);
				copy.setAttribute('role', 'button');
				copy.setAttribute('tabindex', '0');
				copy.setAttribute(
					'aria-label',
					c.name + '。クリックで詳細、ダブルクリックまたは右クリックでデッキから戻す'
				);
				appendCardImage(copy, c);
				wireSparkOnMiniCardHost(copy, c);
				bindClickOpenCardDetail(copy, c);
				bindCardTooltip(copy, c);
				const removeFromDeck = function () {
					copy.remove();
					refreshLib();
					update();
				};
				bindDeckDoubleAction(copy, removeFromDeck);
				bindDeckContextMenu(copy, removeFromDeck);
				deckZone.appendChild(copy);
				refreshLib();
				update();
			};
			bindDeckDoubleAction(el, addToDeck);
			bindDeckContextMenu(el, addToDeck);
			libZone.appendChild(el);
			added++;
		});
		if (added === 0 && list.length === 0 && seeds.length > 0) {
			const hasSearch = libSearch && libSearch.value.trim();
			const hasAttr = libFilterAttr && libFilterAttr.value;
			const hasPow = libFilterPower && libFilterPower.value !== '';
			const hasCost = libFilterCost && libFilterCost.value !== '';
			const hasRar = libFilterRarity && libFilterRarity.value;
			if (hasSearch || hasAttr || hasPow || hasCost || hasRar) {
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
		if (clearAllDeckBtn) {
			clearAllDeckBtn.disabled = n === 0;
		}
		const ids = Array.from(deckZone.querySelectorAll('.mini-card')).map(function (x) { return x.dataset.id; });
		cardIdsInput.value = ids.join(',');
	}

	function clearDeckToLibrary() {
		if (!deckZone) return;
		deckZone.querySelectorAll('.mini-card').forEach(function (node) {
			node.remove();
		});
		hideTooltip();
		closeCardDetailModal();
		refreshLib();
		update();
	}

	if (clearAllDeckBtn) {
		clearAllDeckBtn.addEventListener('click', function () {
			clearDeckToLibrary();
		});
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
			copy.setAttribute(
				'aria-label',
				c.name + '。クリックで詳細、ダブルクリックまたは右クリックでデッキから戻す'
			);
			appendCardImage(copy, c);
			wireSparkOnMiniCardHost(copy, c);
			bindClickOpenCardDetail(copy, c);
			bindCardTooltip(copy, c);
			const removeFromDeck = function () {
				copy.remove();
				refreshLib();
				update();
			};
			bindDeckDoubleAction(copy, removeFromDeck);
			bindDeckContextMenu(copy, removeFromDeck);
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
	if (libFilterCost) {
		libFilterCost.addEventListener('change', onFilterChange);
	}
	if (libFilterRarity) {
		libFilterRarity.addEventListener('change', onFilterChange);
	}

	document.addEventListener('scroll', hideTooltip, true);
	window.addEventListener('blur', hideTooltip);

	if (detailModal) {
		detailModal.addEventListener('click', function (e) {
			if (e.target === detailModal) closeCardDetailModal();
		});
		detailModal.querySelectorAll('[data-library-detail-close]').forEach(function (el) {
			el.addEventListener('click', closeCardDetailModal);
		});
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && detailModal && !detailModal.hidden) closeCardDetailModal();
		});
	}

	bootstrapDeck();
	refreshLib();
	update();
})();
