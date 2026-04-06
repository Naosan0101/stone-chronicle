package com.example.stonechronicle.service;

import com.example.stonechronicle.GameConstants;
import com.example.stonechronicle.domain.AppUser;
import com.example.stonechronicle.domain.CardDefinition;
import com.example.stonechronicle.repository.AppUserMapper;
import com.example.stonechronicle.repository.UserCollectionMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PackService {

	private final AppUserMapper appUserMapper;
	private final UserCollectionMapper userCollectionMapper;
	private final CardCatalogService cardCatalogService;
	private final MissionService missionService;

	@Transactional
	public List<CardDefinition> openPack(long userId) {
		AppUser u = appUserMapper.findById(userId);
		if (u == null) {
			throw new IllegalStateException("ユーザーが見つかりません");
		}
		if (u.getCoins() < GameConstants.PACK_COST) {
			throw new IllegalArgumentException("コインが足りません（" + GameConstants.PACK_COST + "コイン必要）");
		}
		appUserMapper.updateCoins(userId, u.getCoins() - GameConstants.PACK_COST);
		Random rnd = new Random();
		List<CardDefinition> pulled = new ArrayList<>();
		List<CardDefinition> all = cardCatalogService.all();
		for (int i = 0; i < GameConstants.PACK_CARD_COUNT; i++) {
			CardDefinition c = all.get(rnd.nextInt(all.size()));
			userCollectionMapper.upsertAdd(userId, c.getId(), 1);
			pulled.add(c);
		}
		missionService.onPackOpened(userId);
		return pulled;
	}
}
