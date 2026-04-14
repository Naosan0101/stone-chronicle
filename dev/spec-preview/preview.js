(function () {
	"use strict";

	var STATIC_ROOT = "../../src/main/resources/static/images/cards/";

	function normalizeExtJs(filename) {
		if (!filename) {
			return filename;
		}
		var dot = filename.lastIndexOf(".");
		if (dot < 0) {
			return filename;
		}
		var base = filename.slice(0, dot);
		var ext = filename.slice(dot).toLowerCase();
		if (ext === ".png") {
			return base + ".PNG";
		}
		if (ext === ".jpg" || ext === ".jpeg") {
			return base + ".JPEG";
		}
		return base + filename.slice(dot).toUpperCase();
	}

	/** GameConstants.encCardFile に近い（ローカル file 用。NFD → NFC の順で試す） */
	function hrefForCardFile(filename, form) {
		var trimmed = (filename || "").trim();
		if (!trimmed) {
			return "";
		}
		var n = form === "nfc" ? trimmed.normalize("NFC") : trimmed.normalize("NFD");
		return STATIC_ROOT + encodeURIComponent(normalizeExtJs(n));
	}

	function bindImgFallback(img, filename) {
		var step = 0;
		img.addEventListener("error", function onErr() {
			step++;
			if (step === 1) {
				img.src = hrefForCardFile(filename, "nfc");
			} else {
				img.hidden = true;
				img.removeAttribute("src");
			}
		});
		img.src = hrefForCardFile(filename, "nfd");
	}

	function singleJapaneseName(code) {
		switch (code) {
			case "HUMAN":
				return "人間";
			case "ELF":
				return "エルフ";
			case "UNDEAD":
				return "アンデッド";
			case "DRAGON":
				return "ドラゴン";
			default:
				return code;
		}
	}

	function japaneseNameLines(attribute) {
		if (!attribute) {
			return [];
		}
		if (attribute.indexOf("_") < 0) {
			return [singleJapaneseName(attribute)];
		}
		return attribute.split("_").map(function (s) {
			return s.trim();
		}).filter(Boolean).map(singleJapaneseName);
	}

	function barFileForAttribute(attribute) {
		var a = (attribute || "").toUpperCase();
		switch (a) {
			case "HUMAN":
				return "人間バー.PNG";
			case "ELF":
				return "エルフバー.PNG";
			case "UNDEAD":
				return "アンデッドバー.PNG";
			case "DRAGON":
				return "ドラゴンバー.PNG";
			case "ELF_UNDEAD":
				return "エルフアンデッドバー.PNG";
			default:
				return "人間バー.PNG";
		}
	}

	function namedPortraitFilename(attribute, cardName) {
		var a = (attribute || "").trim().toUpperCase();
		if (["HUMAN", "ELF", "UNDEAD", "ELF_UNDEAD", "DRAGON"].indexOf(a) < 0) {
			return "";
		}
		var n = (cardName || "").trim();
		if (!n) {
			return "";
		}
		return n + ".PNG";
	}

	function parseCanonMeta(line) {
		var s = line.charAt(0) === "・" ? line.slice(1) : line;
		if (s.indexOf("/効果なし。") >= 0 || s.indexOf("/能力なし。") >= 0) {
			var head = s;
			if (head.indexOf("/効果なし。") >= 0) {
				head = head.split("/効果なし。")[0];
			} else if (head.indexOf("/能力なし。") >= 0) {
				head = head.split("/能力なし。")[0];
			}
			var parts = head.split("/");
			return {
				name: parts[0] || "",
				rarity: parts[1] || "C",
				cost: parseInt(parts[2], 10) || 0,
				basePower: parseInt(parts[3], 10) || 0,
			};
		}
		var markers = ["/配置：", "/配置:", "/常時：", "/常時:"];
		var idx = -1;
		var mlen = 0;
		for (var i = 0; i < markers.length; i++) {
			var j = s.indexOf(markers[i]);
			if (j >= 0 && (idx < 0 || j < idx)) {
				idx = j;
				mlen = markers[i].length;
			}
		}
		if (idx < 0) {
			return { name: "", rarity: "C", cost: 0, basePower: 0 };
		}
		var meta = s.slice(0, idx);
		var parts = meta.split("/");
		var name = parts[0] || "";
		var rarity = parts[1] || "C";
		var cost = parseInt(parts[2], 10);
		if (isNaN(cost)) {
			cost = 0;
		}
		var basePower = 0;
		if (parts.length > 3) {
			if (parts[3] === "" && parts.length > 4) {
				basePower = parseInt(parts[4], 10) || 0;
			} else {
				basePower = parseInt(parts[3], 10) || 0;
			}
		}
		return { name: name, rarity: rarity, cost: cost, basePower: basePower };
	}

	function blocksFromCanonicalLine(line) {
		var s = line.charAt(0) === "・" ? line.slice(1) : line;
		if (s.indexOf("/効果なし。") >= 0 || s.indexOf("/能力なし。") >= 0) {
			return [{ headline: "", body: "効果なし。" }];
		}
		var markers = [
			{ m: "/配置：", h: "〈配置〉" },
			{ m: "/配置:", h: "〈配置〉" },
			{ m: "/常時：", h: "〈常時〉" },
			{ m: "/常時:", h: "〈常時〉" },
		];
		for (var i = 0; i < markers.length; i++) {
			var idx = s.indexOf(markers[i].m);
			if (idx >= 0) {
				return [{ headline: markers[i].h, body: s.slice(idx + markers[i].m.length) }];
			}
		}
		return [{ headline: "", body: s }];
	}

	function costClass(cost) {
		var s = "card-face__cost";
		if (cost === 1) {
			s += " card-face__cost--digit-1";
		}
		if (cost === 2) {
			s += " card-face__cost--digit-2";
		}
		return s;
	}

	function powerClass(power) {
		return power === 4 ? "card-face__power card-face__power--digit-4" : "card-face__power";
	}

	function buildCardFaceEl(meta, attribute, blocks) {
		var attr = attribute || "HUMAN";
		var rarity = meta.rarity || "C";
		var face = document.createElement("div");
		face.className =
			"card-face card-face--layered card-face--attr-" +
			attr +
			" card-face--rarity-" +
			rarity;

		var stack = document.createElement("div");
		stack.className = "card-face__stack";
		stack.setAttribute("aria-hidden", "true");

		var base = document.createElement("img");
		base.className = "card-face__layer-img card-face__layer-img--base";
		bindImgFallback(base, "カード基盤.PNG");
		stack.appendChild(base);

		var portraitName = namedPortraitFilename(attr, meta.name);
		if (portraitName) {
			var portrait = document.createElement("img");
			portrait.className = "card-face__layer-img card-face__layer-img--portrait";
			bindImgFallback(portrait, portraitName);
			stack.appendChild(portrait);
		}

		var bar = document.createElement("img");
		bar.className = "card-face__layer-img card-face__layer-img--bar";
		bindImgFallback(bar, barFileForAttribute(attr));
		stack.appendChild(bar);

		var frame = document.createElement("img");
		frame.className = "card-face__layer-img card-face__layer-img--frame";
		frame.setAttribute("fetchpriority", "high");
		bindImgFallback(frame, "カード基礎データ.PNG");
		stack.appendChild(frame);

		face.appendChild(stack);

		var datum = document.createElement("div");
		datum.className = "card-face__layer card-face__datum";

		var costSp = document.createElement("span");
		costSp.className = costClass(meta.cost);
		costSp.textContent = String(meta.cost);
		datum.appendChild(costSp);

		var powSp = document.createElement("span");
		powSp.className = powerClass(meta.basePower);
		powSp.textContent = String(meta.basePower);
		datum.appendChild(powSp);

		var nameSp = document.createElement("span");
		nameSp.className = "card-face__name";
		nameSp.textContent = meta.name;
		datum.appendChild(nameSp);

		var attrLines = japaneseNameLines(attr);
		var attrLabel = document.createElement("span");
		attrLabel.className = "card-face__attr-label";
		if (attrLines.length > 1) {
			attrLabel.classList.add("card-face__attr-label--compound");
		}
		attrLines.forEach(function (line) {
			var ln = document.createElement("span");
			ln.className = "card-face__attr-line";
			ln.textContent = line;
			attrLabel.appendChild(ln);
		});
		datum.appendChild(attrLabel);

		var rar = document.createElement("span");
		rar.className = "card-face__rarity";
		rar.textContent = rarity;
		datum.appendChild(rar);

		face.appendChild(datum);

		var narrative = document.createElement("div");
		narrative.className = "card-face__layer card-face__narrative";
		var ability = document.createElement("div");
		ability.className = "card-face__ability";
		blocks.forEach(function (block) {
			if (block.headline) {
				var h = document.createElement("p");
				h.className = "card-face__ability-head";
				h.textContent = block.headline;
				ability.appendChild(h);
			}
			var b = document.createElement("p");
			b.className = "card-face__ability-body";
			b.textContent = block.body;
			ability.appendChild(b);
		});
		narrative.appendChild(ability);
		face.appendChild(narrative);

		var spark = document.createElement("div");
		spark.className = "card-spark";
		spark.setAttribute("aria-hidden", "true");
		face.appendChild(spark);

		return face;
	}

	function render() {
		var spec = window.NINE_UNIVERSE_DEV_SPEC;
		if (!spec || !spec.canonicalLines) {
			return;
		}
		var grid = document.getElementById("card-grid");
		var filterEl = document.getElementById("filter");
		if (!grid) {
			return;
		}
		grid.innerHTML = "";

		var ids = Object.keys(spec.canonicalLines)
			.map(Number)
			.filter(function (n) {
				return !isNaN(n);
			})
			.sort(function (a, b) {
				return a - b;
			});

		var q = (filterEl && filterEl.value.trim().toLowerCase()) || "";

		ids.forEach(function (id) {
			var line = spec.canonicalLines[id];
			if (!line) {
				return;
			}
			if (q) {
				var hay = (line + " " + (spec.attributeById[id] || "")).toLowerCase();
				if (hay.indexOf(q) < 0) {
					return;
				}
			}

			var meta = parseCanonMeta(line);
			var attribute = (spec.attributeById && spec.attributeById[id]) || "HUMAN";
			var blocks = blocksFromCanonicalLine(line);

			var cell = document.createElement("article");
			cell.className = "spec-preview__cell";

			var caption = document.createElement("p");
			caption.className = "spec-preview__caption muted";
			caption.textContent = "ID " + id;
			cell.appendChild(caption);

			cell.appendChild(buildCardFaceEl(meta, attribute, blocks));

			var pre = document.createElement("pre");
			pre.className = "spec-preview__line";
			pre.textContent = line;
			cell.appendChild(pre);

			grid.appendChild(cell);
		});
	}

	document.addEventListener("DOMContentLoaded", function () {
		render();
		var f = document.getElementById("filter");
		if (f) {
			f.addEventListener("input", render);
		}
	});
})();
