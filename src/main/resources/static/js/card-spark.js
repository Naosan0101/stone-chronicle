/**
 * カード上のキラ粒（R/Ep/Reg）。各粒にランダムな周期・遅延を付けて無限ループさせる。
 */
(function (global) {
	'use strict';

	function fillContinuousCardSpark(sparkEl, rarity) {
		if (!sparkEl) return;
		sparkEl.textContent = '';
		const r = (rarity || 'C').trim();
		if (r === 'C') {
			sparkEl.hidden = true;
			sparkEl.classList.remove(
				'is-on',
				'card-spark--continuous',
				'spark--R',
				'spark--Ep',
				'spark--Reg'
			);
			return;
		}

		const count = r === 'Reg' ? 28 : r === 'Ep' ? 22 : 18;
		const streaks = r === 'Reg' ? 5 : r === 'Ep' ? 4 : 3;
		const stars = r === 'Reg' ? 9 : r === 'Ep' ? 7 : 5;

		for (let i = 0; i < count; i++) {
			const p = document.createElement('i');
			p.className = 'spark-particle spark-particle--dot spark-particle--loop';
			const isDiamond = i % 5 === 0;
			if (isDiamond) {
				p.classList.add('spark-particle--diamond');
			}
			p.style.setProperty('--spin', isDiamond ? '45deg' : '0deg');
			p.style.setProperty('--x', (Math.random() * 100).toFixed(2) + '%');
			p.style.setProperty('--y', (Math.random() * 100).toFixed(2) + '%');
			p.style.setProperty('--dx', ((Math.random() * 2 - 1) * (r === 'Reg' ? 14 : 11)).toFixed(2) + 'px');
			p.style.setProperty('--dy', ((Math.random() * 2 - 1) * (r === 'Reg' ? 18 : 14)).toFixed(2) + 'px');
			p.style.setProperty('--s', (0.72 + Math.random() * 0.92).toFixed(2));
			p.style.setProperty('--d', (Math.random() * 3200).toFixed(0) + 'ms');
			p.style.setProperty('--t', (2200 + Math.random() * 5200).toFixed(0) + 'ms');
			p.style.setProperty('--a', (0.38 + Math.random() * 0.48).toFixed(2));
			p.style.setProperty('--a0', (0.1 + Math.random() * 0.22).toFixed(2));
			sparkEl.appendChild(p);
		}

		for (let i = 0; i < streaks; i++) {
			const p = document.createElement('i');
			p.className = 'spark-particle spark-particle--streak spark-particle--loop';
			p.style.setProperty('--x', (18 + Math.random() * 64).toFixed(2) + '%');
			p.style.setProperty('--y', (14 + Math.random() * 58).toFixed(2) + '%');
			p.style.setProperty('--rot', (-38 + Math.random() * 76).toFixed(2) + 'deg');
			p.style.setProperty('--len', ((r === 'Reg' ? 70 : 56) + Math.random() * 42).toFixed(0) + 'px');
			p.style.setProperty('--d', (Math.random() * 4000).toFixed(0) + 'ms');
			p.style.setProperty('--t', (2600 + Math.random() * 6200).toFixed(0) + 'ms');
			p.style.setProperty('--a', (0.16 + Math.random() * 0.32).toFixed(2));
			sparkEl.appendChild(p);
		}

		for (let i = 0; i < stars; i++) {
			const p = document.createElement('i');
			p.className = 'spark-particle spark-particle--star spark-particle--loop';
			p.style.setProperty('--x', (Math.random() * 100).toFixed(2) + '%');
			p.style.setProperty('--y', (Math.random() * 100).toFixed(2) + '%');
			p.style.setProperty('--dx', ((Math.random() * 2 - 1) * (r === 'Reg' ? 16 : 12)).toFixed(2) + 'px');
			p.style.setProperty('--dy', ((Math.random() * 2 - 1) * (r === 'Reg' ? 18 : 14)).toFixed(2) + 'px');
			p.style.setProperty('--s', (0.58 + Math.random() * 1.08).toFixed(2));
			p.style.setProperty('--rot', (Math.random() * 360).toFixed(0) + 'deg');
			p.style.setProperty('--d', (Math.random() * 3600).toFixed(0) + 'ms');
			p.style.setProperty('--t', (2400 + Math.random() * 6400).toFixed(0) + 'ms');
			p.style.setProperty('--a', (0.3 + Math.random() * 0.45).toFixed(2));
			p.style.setProperty('--a0', (0.06 + Math.random() * 0.16).toFixed(2));
			sparkEl.appendChild(p);
		}

		sparkEl.classList.remove('spark--R', 'spark--Ep', 'spark--Reg');
		if (r === 'R') sparkEl.classList.add('spark--R');
		if (r === 'Ep') sparkEl.classList.add('spark--Ep');
		if (r === 'Reg') sparkEl.classList.add('spark--Reg');

		sparkEl.classList.add('card-spark--continuous');
		sparkEl.classList.remove('is-on');
		void sparkEl.offsetWidth;
		sparkEl.classList.add('is-on');
		sparkEl.hidden = false;
	}

	global.fillContinuousCardSpark = fillContinuousCardSpark;
})(typeof window !== 'undefined' ? window : this);
