(function () {
	const libZone = document.getElementById('lib-zone');
	const deckZone = document.getElementById('deck-zone');
	const deckCount = document.getElementById('deck-count');
	const completeBtn = document.getElementById('complete-btn');
	const cardIdsInput = document.getElementById('cardIds');
	const preview = document.getElementById('preview');
	const previewImg = document.getElementById('preview-img');
	const libSearch = document.getElementById('lib-search');
	const libSort = document.getElementById('lib-sort');

	const ATTR_ORDER = { HUMAN: 0, ELF: 1, UNDEAD: 2, DRAGON: 3 };

	const seeds = Array.from(document.querySelectorAll('#lib-seed .seed')).map(function (el) {
		const p = parseInt(el.dataset.power, 10);
		return {
			id: parseInt(el.dataset.id, 10),
			img: el.dataset.img,
			qty: parseInt(el.dataset.qty, 10) || 0,
			name: el.dataset.name || '',
			attribute: el.dataset.attribute || '',
			power: isNaN(p) ? 0 : p
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

	function cmpAttr(a, b) {
		const ao = ATTR_ORDER[a.attribute] !== undefined ? ATTR_ORDER[a.attribute] : 99;
		const bo = ATTR_ORDER[b.attribute] !== undefined ? ATTR_ORDER[b.attribute] : 99;
		return ao - bo;
	}

	function cmpPower(a, b) {
		return a.power - b.power;
	}

	function cmpName(a, b) {
		return a.name.localeCompare(b.name, 'ja');
	}

	function sortedLibraryList() {
		const q = libSearch ? libSearch.value.trim() : '';
		let list = seeds.filter(function (c) {
			if (!q) return true;
			return c.name.indexOf(q) !== -1;
		});
		const mode = libSort ? libSort.value : 'attr_power_asc';
		list = list.slice();
		list.sort(function (a, b) {
			let r;
			switch (mode) {
				case 'attr_power_desc':
					r = cmpAttr(a, b);
					if (r !== 0) return r;
					r = cmpPower(b, a);
					if (r !== 0) return r;
					return cmpName(a, b);
				case 'power_attr_asc':
					r = cmpPower(a, b);
					if (r !== 0) return r;
					r = cmpAttr(a, b);
					if (r !== 0) return r;
					return cmpName(a, b);
				case 'power_attr_desc':
					r = cmpPower(b, a);
					if (r !== 0) return r;
					r = cmpAttr(a, b);
					if (r !== 0) return r;
					return cmpName(a, b);
				case 'attr_power_asc':
				default:
					r = cmpAttr(a, b);
					if (r !== 0) return r;
					r = cmpPower(a, b);
					if (r !== 0) return r;
					return cmpName(a, b);
			}
		});
		return list;
	}

	function appendCardImage(parent, c) {
		const im = document.createElement('img');
		im.src = c.img;
		im.alt = c.name;
		parent.appendChild(im);
	}

	function bindPreview(el, c) {
		el.addEventListener('contextmenu', function (e) {
			e.preventDefault();
			previewImg.src = c.img;
			previewImg.alt = c.name;
			preview.hidden = false;
		});
	}

	function refreshLib() {
		libZone.innerHTML = '';
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
			el.setAttribute('aria-label', c.name + '（強さ' + c.power + '）をデッキへ');
			appendCardImage(el, c);
			bindPreview(el, c);
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
		if (added === 0 && libSearch && libSearch.value.trim() && list.length === 0) {
			const p = document.createElement('p');
			p.className = 'muted deck-lib-empty-msg';
			p.textContent = '検索に一致するカードがありません。';
			libZone.appendChild(p);
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

	if (libSearch) {
		libSearch.addEventListener('input', refreshLib);
	}
	if (libSort) {
		libSort.addEventListener('change', refreshLib);
	}

	bootstrapDeck();
	refreshLib();
	update();
})();
