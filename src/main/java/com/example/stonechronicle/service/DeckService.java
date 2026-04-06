package com.example.stonechronicle.service;

import com.example.stonechronicle.domain.Deck;
import com.example.stonechronicle.domain.DeckEntry;
import com.example.stonechronicle.repository.DeckEntryMapper;
import com.example.stonechronicle.repository.DeckMapper;
import com.example.stonechronicle.repository.UserCollectionMapper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DeckService {

	private final DeckMapper deckMapper;
	private final DeckEntryMapper deckEntryMapper;
	private final UserCollectionMapper userCollectionMapper;
	private final MissionService missionService;

	public List<Deck> listDecks(long userId) {
		return deckMapper.findByUserId(userId);
	}

	public Deck requireDeck(long userId, long deckId) {
		Deck d = deckMapper.findByIdAndUserId(deckId, userId);
		if (d == null) {
			throw new IllegalArgumentException("デッキが見つかりません");
		}
		return d;
	}

	public List<DeckEntry> entries(long deckId) {
		return deckEntryMapper.findByDeckId(deckId);
	}

	@Transactional
	public long createDeck(long userId, String name, List<Short> cardIds, boolean countMission) {
		validateEight(cardIds, userId);
		Deck d = new Deck();
		d.setUserId(userId);
		d.setName(name.trim().isEmpty() ? "マイデッキ" : name.trim());
		deckMapper.insert(d);
		saveEntries(d.getId(), cardIds);
		if (countMission) {
			missionService.onDeckSaved(userId);
		}
		return d.getId();
	}

	@Transactional
	public void updateDeck(long userId, long deckId, String name, List<Short> cardIds) {
		requireDeck(userId, deckId);
		validateEight(cardIds, userId);
		deckMapper.updateName(deckId, userId, name.trim().isEmpty() ? "マイデッキ" : name.trim());
		deckEntryMapper.deleteByDeckId(deckId);
		saveEntries(deckId, cardIds);
		missionService.onDeckSaved(userId);
	}

	private void saveEntries(long deckId, List<Short> cardIds) {
		for (int i = 0; i < 8; i++) {
			deckEntryMapper.insert(deckId, (short) (i + 1), cardIds.get(i));
		}
	}

	@Transactional
	public void deleteDeck(long userId, long deckId) {
		requireDeck(userId, deckId);
		deckMapper.delete(deckId, userId);
	}

	private void validateEight(List<Short> cardIds, long userId) {
		if (cardIds == null || cardIds.size() != 8) {
			throw new IllegalArgumentException("デッキは8枚必要です");
		}
		Map<Short, Integer> inDeck = new HashMap<>();
		for (Short id : cardIds) {
			inDeck.merge(id, 1, Integer::sum);
			if (inDeck.get(id) > 2) {
				throw new IllegalArgumentException("同じカードは2枚までです");
			}
			int owned = userCollectionMapper.findQuantity(userId, id);
			if (owned < inDeck.get(id)) {
				throw new IllegalArgumentException("所有枚数を超えています");
			}
		}
	}

	public List<Short> cardIdsForDeck(long deckId) {
		return deckEntryMapper.findByDeckId(deckId).stream().map(DeckEntry::getCardId).toList();
	}
}
