package com.example.nineuniverse.service;

import com.example.nineuniverse.GameConstants;
import com.example.nineuniverse.domain.AppUser;
import com.example.nineuniverse.domain.CardDefinition;
import com.example.nineuniverse.repository.AppUserMapper;
import com.example.nineuniverse.repository.UserCollectionMapper;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Random;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PackService {

	public enum PackType {
		STANDARD(3),
		WINDY_HILL(4),
		EVIL_THREAT(5);

		public final int cost;

		PackType(int cost) {
			this.cost = cost;
		}
	}

	private final AppUserMapper appUserMapper;
	private final UserCollectionMapper userCollectionMapper;
	private final CardCatalogService cardCatalogService;
	private final MissionService missionService;

	@Transactional
	public List<CardDefinition> openPack(long userId) {
		return openPack(userId, PackType.STANDARD);
	}

	@Transactional
	public List<CardDefinition> openPack(long userId, PackType type) {
		AppUser u = appUserMapper.findById(userId);
		if (u == null) {
			throw new IllegalStateException("ユーザーが見つかりません");
		}
		PackType t = type != null ? type : PackType.STANDARD;
		if (u.getCoins() < t.cost) {
			throw new IllegalArgumentException("ジェムが足りません（" + t.cost + "ジェム必要）");
		}
		appUserMapper.updateCoins(userId, u.getCoins() - t.cost);
		Random rnd = new Random();
		List<CardDefinition> pulled = new ArrayList<>();
		List<CardDefinition> all = filterCardsForPack(cardCatalogService.all(), t);
		if (all.isEmpty()) {
			all = cardCatalogService.all();
		}
		for (int i = 0; i < GameConstants.PACK_CARD_COUNT; i++) {
			CardDefinition c = pickWeightedByRarity(all, rnd);
			userCollectionMapper.upsertAdd(userId, c.getId(), 1);
			pulled.add(c);
		}
		missionService.onPackOpened(userId);
		return pulled;
	}

	/**
	 * 購入画面の「詳細」用：開封と同じ集合をレア度降順→名前で並べた一覧。
	 */
	public List<CardDefinition> sortedEligibleCardsForPreview(PackType type) {
		List<CardDefinition> list = new ArrayList<>(eligibleCardsForPack(type));
		list.sort(Comparator
				.comparingInt(PackService::raritySortKey)
				.thenComparing(c -> c.getName() != null ? c.getName() : "", String.CASE_INSENSITIVE_ORDER));
		return list;
	}

	public List<CardDefinition> eligibleCardsForPack(PackType type) {
		List<CardDefinition> all = filterCardsForPack(cardCatalogService.all(), type);
		if (all.isEmpty()) {
			return new ArrayList<>(cardCatalogService.all());
		}
		return all;
	}

	private static int raritySortKey(CardDefinition c) {
		String r = c != null ? c.getRarity() : null;
		if (r == null || r.isBlank()) {
			return 3;
		}
		return switch (r.trim()) {
			case "Reg" -> 0;
			case "Ep" -> 1;
			case "R" -> 2;
			case "C" -> 3;
			default -> 4;
		};
	}

	private static List<CardDefinition> filterCardsForPack(List<CardDefinition> all, PackType type) {
		if (all == null || all.isEmpty()) return List.of();
		if (type == null || type == PackType.STANDARD) return all;
		List<CardDefinition> out = new ArrayList<>();
		for (CardDefinition c : all) {
			if (c == null) continue;
			// 風の魔人（ID=14）は邪悪なる脅威パックから除外
			if (type == PackType.EVIL_THREAT && c.getId() != null && c.getId() == 14) continue;
			String attr = c.getAttribute();
			if (attr == null) continue;
			boolean isHuman = hasAttr(attr, "HUMAN");
			boolean isElf = hasAttr(attr, "ELF");
			boolean isUndead = hasAttr(attr, "UNDEAD");
			boolean isDragon = hasAttr(attr, "DRAGON");
			if (type == PackType.WINDY_HILL && (isHuman || isElf)) out.add(c);
			if (type == PackType.EVIL_THREAT && (isUndead || isDragon)) out.add(c);
		}
		return out;
	}

	private static boolean hasAttr(String attr, String seg) {
		String a = attr.trim().toUpperCase();
		String s = seg.trim().toUpperCase();
		if (a.equals(s)) return true;
		return a.contains("_") && List.of(a.split("_")).contains(s);
	}

	private static CardDefinition pickWeightedByRarity(List<CardDefinition> all, Random rnd) {
		if (all == null || all.isEmpty()) {
			throw new IllegalStateException("カード定義が空です");
		}
		String target = rollRarity(rnd);
		List<CardDefinition> pool = new ArrayList<>();
		for (CardDefinition c : all) {
			String r = c != null ? c.getRarity() : null;
			if (r == null || r.isBlank()) {
				r = "C";
			}
			if (target.equalsIgnoreCase(r.trim())) {
				pool.add(c);
			}
		}
		List<CardDefinition> pickFrom = pool.isEmpty() ? all : pool;
		return pickFrom.get(rnd.nextInt(pickFrom.size()));
	}

	/**
	 * 排出率: C 50% / R 30% / Ep 17% / Reg 3%
	 */
	private static String rollRarity(Random rnd) {
		int x = rnd.nextInt(100); // 0..99
		if (x < 50) return "C";
		if (x < 80) return "R";
		if (x < 97) return "Ep";
		return "Reg";
	}
}
