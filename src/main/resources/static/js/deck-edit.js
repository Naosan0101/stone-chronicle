(function () {
	const libZone = document.getElementById('lib-zone');
	const deckZone = document.getElementById('deck-zone');
	const deckCount = document.getElementById('deck-count');
	const completeBtn = document.getElementById('complete-btn');
	const cardIdsInput = document.getElementById('cardIds');
	const preview = document.getElementById('preview');
	const previewImg = document.getElementById('preview-img');

	const seeds = Array.from(document.querySelectorAll('#lib-seed .seed')).map(function (el) {
		return {
			id: parseInt(el.dataset.id, 10),
			img: el.dataset.img,
			qty: parseInt(el.dataset.qty, 10) || 0,
			name: el.dataset.name || ''
		};
	}).filter(function (c) { return c.qty > 0; });

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

	function refreshLib() {
		libZone.innerHTML = '';
		if (deckZone.querySelectorAll('.mini-card').length >= 8) {
			return;
		}
		seeds.forEach(function (c) {
			const cap = maxPerForId(c.id);
			const inDeck = countInDeck(c.id);
			if (inDeck >= cap) return;
			const el = document.createElement('button');
			el.type = 'button';
			el.className = 'mini-card';
			el.dataset.id = String(c.id);
			el.innerHTML = '<img src="' + c.img + '" alt="' + c.name + '"/>';
			el.addEventListener('click', function () {
				if (!canAddToDeck(c.id, cap)) return;
				const copy = document.createElement('div');
				copy.className = 'mini-card';
				copy.dataset.id = String(c.id);
				copy.innerHTML = '<img src="' + c.img + '" alt="' + c.name + '"/>';
				copy.addEventListener('click', function () {
					copy.remove();
					refreshLib();
					update();
				});
				copy.addEventListener('contextmenu', function (e) {
					e.preventDefault();
					previewImg.src = c.img;
					previewImg.alt = c.name;
					preview.hidden = false;
				});
				deckZone.appendChild(copy);
				refreshLib();
				update();
			});
			el.addEventListener('contextmenu', function (e) {
				e.preventDefault();
				previewImg.src = c.img;
				previewImg.alt = c.name;
				preview.hidden = false;
			});
			libZone.appendChild(el);
		});
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
			copy.className = 'mini-card';
			copy.dataset.id = String(id);
			copy.innerHTML = '<img src="' + c.img + '" alt="' + c.name + '"/>';
			copy.addEventListener('click', function () {
				copy.remove();
				refreshLib();
				update();
			});
			copy.addEventListener('contextmenu', function (e) {
				e.preventDefault();
				previewImg.src = c.img;
				previewImg.alt = c.name;
				preview.hidden = false;
			});
			deckZone.appendChild(copy);
		});
	}

	bootstrapDeck();
	refreshLib();
	update();
})();
