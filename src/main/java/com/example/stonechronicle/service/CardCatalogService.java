package com.example.stonechronicle.service;

import com.example.stonechronicle.domain.CardDefinition;
import com.example.stonechronicle.repository.CardDefinitionMapper;
import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Service;

/**
 * Flyway の {@code flywayInitializer} より後に初期化し、マイグレーション済みのスキーマを参照する。
 */
@Service
@DependsOn("flywayInitializer")
@RequiredArgsConstructor
public class CardCatalogService {

	private final CardDefinitionMapper cardDefinitionMapper;
	private volatile Map<Short, CardDefinition> byId = Map.of();
	private volatile boolean cacheReady;

	@PostConstruct
	void loadCatalog() {
		refresh();
		cacheReady = true;
	}

	public void refresh() {
		List<CardDefinition> all = cardDefinitionMapper.findAll();
		Map<Short, CardDefinition> m = new HashMap<>();
		for (CardDefinition c : all) {
			m.put(c.getId(), c);
		}
		byId = Map.copyOf(m);
	}

	public List<CardDefinition> all() {
		ensureLoaded();
		return cardDefinitionMapper.findAll();
	}

	public Map<Short, CardDefinition> mapById() {
		ensureLoaded();
		return byId;
	}

	public CardDefinition require(short id) {
		ensureLoaded();
		CardDefinition c = byId.get(id);
		if (c == null) {
			throw new IllegalArgumentException("Unknown card: " + id);
		}
		return c;
	}

	private void ensureLoaded() {
		if (!cacheReady) {
			synchronized (this) {
				if (!cacheReady) {
					refresh();
					cacheReady = true;
				}
			}
		}
	}
}
