/**
 * カード上のキラ粒（R/Ep/Reg）。各粒にランダムな周期・遅延を付けて無限ループさせる。
 * パック開封は fillPackRevealBurstSpark（約2秒のバースト）。
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
			p.style.setProperty('--a', (0.18 + Math.random() * 0.26).toFixed(2));
			p.style.setProperty('--a0', (0.05 + Math.random() * 0.1).toFixed(2));
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
			p.style.setProperty('--a', (0.08 + Math.random() * 0.16).toFixed(2));
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
			p.style.setProperty('--a', (0.14 + Math.random() * 0.22).toFixed(2));
			p.style.setProperty('--a0', (0.03 + Math.random() * 0.07).toFixed(2));
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

	/**
	 * パック開封：めくった瞬間だけ、カード周囲に約2秒の派手なキラ（終了後に DOM を片付ける）
	 */
	function fillPackRevealBurstSpark(sparkEl, rarity) {
		if (!sparkEl) return;
		sparkEl.textContent = '';
		sparkEl.classList.remove(
			'is-on',
			'card-spark--continuous',
			'spark--R',
			'spark--Ep',
			'spark--Reg',
			'spark--burst-reveal',
			'spark--burst-C'
		);

		const r = (rarity || 'C').trim();
		if (r === 'R') sparkEl.classList.add('spark--R');
		else if (r === 'Ep') sparkEl.classList.add('spark--Ep');
		else if (r === 'Reg') sparkEl.classList.add('spark--Reg');
		else sparkEl.classList.add('spark--burst-C');

		// さらに控えめ：粒数をさらに減らし、透明度も上げる（= opacity を下げる）
		const dotCount = r === 'Reg' ? 16 : r === 'Ep' ? 12 : r === 'R' ? 10 : 8;
		const streaks = r === 'Reg' ? 3 : r === 'Ep' ? 2 : r === 'R' ? 1 : 1;
		const stars = r === 'Reg' ? 4 : r === 'Ep' ? 3 : r === 'R' ? 2 : 2;

		for (let i = 0; i < dotCount; i++) {
			const p = document.createElement('i');
			const isDiamond = i % 4 === 0;
			p.className = 'spark-particle spark-particle--burst-dot' + (isDiamond ? ' spark-particle--burst-diamond' : '');
			p.style.setProperty('--spin', isDiamond ? '45deg' : '0deg');
			p.style.setProperty('--x', (Math.random() * 100).toFixed(2) + '%');
			p.style.setProperty('--y', (Math.random() * 100).toFixed(2) + '%');
			const mag = r === 'Reg' ? 22 : r === 'Ep' ? 18 : r === 'R' ? 16 : 14;
			p.style.setProperty('--dx', ((Math.random() * 2 - 1) * mag).toFixed(2) + 'px');
			p.style.setProperty('--dy', ((Math.random() * 2 - 1) * (mag + 4)).toFixed(2) + 'px');
			p.style.setProperty('--s', (0.85 + Math.random() * 1.15).toFixed(2));
			p.style.setProperty('--d', (Math.random() * 520).toFixed(0) + 'ms');
			p.style.setProperty('--a', (0.07 + Math.random() * 0.06).toFixed(2));
			sparkEl.appendChild(p);
		}

		for (let i = 0; i < streaks; i++) {
			const p = document.createElement('i');
			p.className = 'spark-particle spark-particle--burst-streak';
			p.style.setProperty('--x', (10 + Math.random() * 80).toFixed(2) + '%');
			p.style.setProperty('--y', (8 + Math.random() * 72).toFixed(2) + '%');
			p.style.setProperty('--rot', (-52 + Math.random() * 104).toFixed(2) + 'deg');
			p.style.setProperty('--len', ((r === 'Reg' ? 88 : 72) + Math.random() * 56).toFixed(0) + 'px');
			p.style.setProperty('--d', (Math.random() * 380).toFixed(0) + 'ms');
			p.style.setProperty('--a', (0.05 + Math.random() * 0.04).toFixed(2));
			sparkEl.appendChild(p);
		}

		for (let i = 0; i < stars; i++) {
			const p = document.createElement('i');
			p.className = 'spark-particle spark-particle--burst-star';
			p.style.setProperty('--x', (Math.random() * 100).toFixed(2) + '%');
			p.style.setProperty('--y', (Math.random() * 100).toFixed(2) + '%');
			const sm = r === 'Reg' ? 20 : r === 'Ep' ? 16 : 14;
			p.style.setProperty('--dx', ((Math.random() * 2 - 1) * sm).toFixed(2) + 'px');
			p.style.setProperty('--dy', ((Math.random() * 2 - 1) * (sm + 2)).toFixed(2) + 'px');
			p.style.setProperty('--s', (0.75 + Math.random() * 1.25).toFixed(2));
			p.style.setProperty('--rot', (Math.random() * 360).toFixed(0) + 'deg');
			p.style.setProperty('--d', (Math.random() * 450).toFixed(0) + 'ms');
			p.style.setProperty('--a', (0.06 + Math.random() * 0.05).toFixed(2));
			sparkEl.appendChild(p);
		}

		sparkEl.classList.add('spark--burst-reveal');
		sparkEl.hidden = false;
		void sparkEl.offsetWidth;
		sparkEl.classList.add('is-on');

		window.setTimeout(function () {
			sparkEl.classList.remove(
				'is-on',
				'spark--burst-reveal',
				'spark--R',
				'spark--Ep',
				'spark--Reg',
				'spark--burst-C'
			);
			sparkEl.textContent = '';
			sparkEl.hidden = true;
		}, 2000);
	}

	global.fillContinuousCardSpark = fillContinuousCardSpark;
	global.fillPackRevealBurstSpark = fillPackRevealBurstSpark;
})(typeof window !== 'undefined' ? window : this);
