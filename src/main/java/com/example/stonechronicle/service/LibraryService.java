package com.example.stonechronicle.service;

import com.example.stonechronicle.CanonicalLibraryCardText;
import com.example.stonechronicle.GameConstants;
import com.example.stonechronicle.card.CardAttributeLabels;
import com.example.stonechronicle.card.CardAttributes;
import com.example.stonechronicle.card.CardFaceAbilityFormatter;
import com.example.stonechronicle.domain.CardDefinition;
import com.example.stonechronicle.domain.LibraryCardView;
import com.example.stonechronicle.repository.UserCollectionMapper;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LibraryService {

	private final CardCatalogService cardCatalogService;
	private final UserCollectionMapper userCollectionMapper;

	public List<LibraryCardView> library(long userId) {
		Map<Short, Integer> qty = userCollectionMapper.findByUserId(userId).stream()
				.collect(Collectors.toMap(r -> r.getCardId(), r -> r.getQuantity()));
		List<LibraryCardView> out = new ArrayList<>();
		for (CardDefinition c : cardCatalogService.all()) {
			LibraryCardView v = new LibraryCardView();
			fillCardFace(v, c);
			int q = qty.getOrDefault(c.getId(), 0);
			v.setQuantity(q);
			v.setOwned(q > 0);
			out.add(v);
		}
		out.sort(Comparator
				.comparingInt((LibraryCardView v) -> v.getCost())
				.thenComparing((LibraryCardView v) -> CardAttributes.primarySegment(v.getAttribute()))
				.thenComparing(LibraryCardView::getAttribute)
				.thenComparingInt(LibraryCardView::getBasePower)
				.thenComparing(LibraryCardView::getName));
		return out;
	}

	/**
	 * パック開封後のフラッシュ復元用（ID のみ渡す）。順序は引きの順のまま。
	 */
	public List<LibraryCardView> displayFacesForCardIds(List<Short> cardIds) {
		Map<Short, CardDefinition> map = cardCatalogService.mapById();
		List<LibraryCardView> out = new ArrayList<>();
		for (Short id : cardIds) {
			if (id == null) {
				continue;
			}
			CardDefinition c = map.get(id);
			if (c == null) {
				continue;
			}
			LibraryCardView v = new LibraryCardView();
			fillCardFace(v, c);
			v.setQuantity(1);
			v.setOwned(true);
			out.add(v);
		}
		return out;
	}

	private void fillCardFace(LibraryCardView v, CardDefinition c) {
		v.setId(c.getId());
		v.setName(c.getName());
		v.setAttribute(c.getAttribute());
		String rarity = c.getRarity();
		v.setRarity(rarity != null && !rarity.isBlank() ? rarity : "C");
		v.setRarityLabel(v.getRarity());
		String portrait = GameConstants.cardPortraitPath(c.getImageFile());
		v.setImagePath(portrait);
		v.setLayerPortraitPath(portrait);
		v.setCost(c.getCost() != null ? c.getCost() : 0);
		v.setBasePower(c.getBasePower() != null ? c.getBasePower() : 0);
		String canon = CanonicalLibraryCardText.lineForId(c.getId());
		v.setCanonicalAbilityLine(canon != null ? canon : "");
		v.setLibraryAbilityText(CardFaceAbilityFormatter.tooltipAbilityTextForCardId(c.getId()));
		v.setAttributeLabelJa(CardAttributeLabels.japaneseName(c.getAttribute()));
		var attrLines = CardAttributeLabels.japaneseNameLines(c.getAttribute());
		v.setAttributeLabelLines(attrLines);
		v.setAttributeLabelPipe(attrLines.isEmpty() ? "" : String.join("|", attrLines));
		v.setBarImagePath(GameConstants.cardLayerBarPath(c.getAttribute()));
		v.setLayerBasePath(GameConstants.CARD_LAYER_BASE);
		v.setLayerFramePath(GameConstants.CARD_LAYER_DATA);
		String dep = c.getDeployHelp();
		String pas = c.getPassiveHelp();
		v.setDeployHelp(dep != null ? dep : "");
		v.setPassiveHelp(pas != null ? pas : "");
		v.setAbilityBlocks(CardFaceAbilityFormatter.blocksForCardId(c.getId()));
		v.setCostFaceCssClass(cardFaceCostClass(v.getCost()));
		v.setPowerFaceCssClass(cardFacePowerClass(v.getBasePower()));
	}

	private static String cardFaceCostClass(short cost) {
		String s = "card-face__cost";
		if (cost == 1) {
			s += " card-face__cost--digit-1";
		}
		if (cost == 2) {
			s += " card-face__cost--digit-2";
		}
		return s;
	}

	private static String cardFacePowerClass(short basePower) {
		return basePower == 4 ? "card-face__power card-face__power--digit-4" : "card-face__power";
	}
}
