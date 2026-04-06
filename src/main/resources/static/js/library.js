(function () {
	const modal = document.getElementById('library-detail-modal');
	const img = modal ? document.getElementById('library-detail-img') : null;
	const artWrap = modal ? document.getElementById('library-detail-art') : null;
	const nameEl = modal ? document.getElementById('library-detail-name') : null;
	const costEl = modal ? document.getElementById('library-detail-cost') : null;
	const powerEl = modal ? document.getElementById('library-detail-power') : null;
	const metaEl = modal ? document.getElementById('library-detail-meta') : null;
	const abilityEl = modal ? document.getElementById('library-detail-ability') : null;

	const ATTR_JA = {
		HUMAN: '人間',
		ELF: 'エルフ',
		UNDEAD: 'アンデッド',
		DRAGON: 'ドラゴン'
	};

	function openModal(btn) {
		if (!modal || !nameEl) return;
		const d = btn.dataset;
		const owned = d.owned === 'true';
		if (!owned) return;
		const qty = d.quantity || '0';
		const attrJa = ATTR_JA[d.attribute] || d.attribute;

		nameEl.textContent = d.name || '';
		costEl.textContent = d.cost != null && d.cost !== '' ? String(d.cost) : '—';
		powerEl.textContent = d.basePower != null && d.basePower !== '' ? String(d.basePower) : '—';

		metaEl.textContent = owned
			? '種族: ' + attrJa + '　所持: ×' + qty
			: '種族: ' + attrJa + '　未所持';

		img.src = d.image || '';
		img.alt = owned ? (d.name || '') : '';
		artWrap.classList.toggle('library-detail-modal__art-wrap--locked', !owned);

		abilityEl.textContent = (d.ability || '').trim();

		modal.hidden = false;
		document.body.style.overflow = 'hidden';
	}

	function closeModal() {
		if (!modal) return;
		modal.hidden = true;
		document.body.style.overflow = '';
		if (img) img.removeAttribute('src');
	}

	document.querySelectorAll('.library-card__open').forEach(function (btn) {
		btn.addEventListener('click', function () {
			openModal(btn);
		});
	});

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

	/* ライブラリページ: 全カードグリッドの並び替え・名前検索 */
	const grid = document.getElementById('library-all-grid');
	const searchInput = document.getElementById('library-search');
	const filterAttr = document.getElementById('library-filter-attr');
	const filterPower = document.getElementById('library-filter-power');
	const emptyMsg = document.getElementById('library-empty-msg');

	if (grid && searchInput && filterAttr && filterPower) {
		const ATTR_ORDER = { HUMAN: 0, ELF: 1, UNDEAD: 2, DRAGON: 3 };
		const cards = Array.from(grid.children).filter(function (el) {
			return el.classList && el.classList.contains('library-card');
		});

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

		function applyBrowser() {
			const q = searchInput.value.trim();
			const attrSel = filterAttr.value;
			const powerSel = filterPower.value;
			let items = cards.map(function (card) {
				const btn = card.querySelector('.library-card__open');
				const d = btn ? btn.dataset : {};
				const p = parseInt(d.basePower, 10);
				return {
					card: card,
					name: d.name || '',
					attribute: d.attribute || '',
					power: isNaN(p) ? 0 : p
				};
			});
			items = items.filter(function (it) {
				if (q && it.name.indexOf(q) === -1) return false;
				if (attrSel && it.attribute !== attrSel) return false;
				if (powerSel && String(it.power) !== String(powerSel)) return false;
				return true;
			});
			// 表示順は固定（種族→強さ→名前）
			items.sort(function (a, b) {
				let r = cmpAttr(a, b);
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
		filterPower.addEventListener('change', applyBrowser);
		applyBrowser();
	}
})();
