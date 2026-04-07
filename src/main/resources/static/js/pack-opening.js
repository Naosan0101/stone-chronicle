(function () {
	const row = document.getElementById('pack-opening-row');
	if (!row) return;

	const cards = Array.from(document.querySelectorAll('.pack-opening-card[data-pack-index]'));
	if (cards.length === 0) return;

	let active = 0;
	let revealed = 0;

	function setActive(i) {
		active = i;
		cards.forEach(function (c, idx) {
			c.classList.toggle('is-active', idx === i);
		});
	}

	function isRare(rarity) {
		return rarity && rarity !== 'C';
	}

	function shake() {
		document.body.classList.add('pack-shake');
		setTimeout(function () {
			document.body.classList.remove('pack-shake');
		}, 1000);
	}

	function revealCard(btn) {
		if (!btn || btn.classList.contains('is-revealed')) return;
		btn.classList.add('is-revealed');

		const face = btn.querySelector('.pack-opening-card__face');
		const back = btn.querySelector('.pack-opening-card__back');
		const spark = btn.querySelector('.pack-opening-card__spark');
		const arrow = btn.querySelector('.pack-opening-card__arrow');
		const rarity = btn.dataset.rarity || 'C';

		if (back) back.classList.add('is-flipped');
		if (face) face.hidden = false;
		if (arrow) arrow.hidden = true;
		if (spark && typeof fillContinuousCardSpark === 'function') {
			fillContinuousCardSpark(spark, rarity);
		}

		if (isRare(rarity)) {
			shake();
		}

		revealed++;
		if (revealed >= cards.length) {
			setTimeout(function () {
				window.location.href = '/pack/result';
			}, 2000);
			return;
		}
		setActive(Math.min(cards.length - 1, active + 1));
	}

	setTimeout(function () {
		row.classList.add('is-dealt');
	}, 50);

	setActive(0);
	cards.forEach(function (btn) {
		btn.addEventListener('click', function () {
			const idx = parseInt(btn.dataset.packIndex, 10);
			if (idx !== active) return;
			revealCard(btn);
		});
	});
})();
