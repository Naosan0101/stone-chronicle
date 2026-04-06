package com.example.stonechronicle.service;

import com.example.stonechronicle.GameConstants;
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
			v.setId(c.getId());
			v.setName(c.getName());
			v.setAttribute(c.getAttribute());
			v.setImagePath(GameConstants.CARD_IMAGE_PREFIX + c.getImageFile());
			int q = qty.getOrDefault(c.getId(), 0);
			v.setQuantity(q);
			v.setOwned(q > 0);
			out.add(v);
		}
		out.sort(Comparator.comparing(LibraryCardView::getAttribute).thenComparing(LibraryCardView::getName));
		return out;
	}
}
