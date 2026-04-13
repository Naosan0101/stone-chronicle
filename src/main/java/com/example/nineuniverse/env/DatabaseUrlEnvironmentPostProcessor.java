package com.example.nineuniverse.env;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.util.StringUtils;

/**
 * Render / Heroku 等の {@code DATABASE_URL}（{@code postgresql://…}）を
 * Spring が解釈できる JDBC 設定へ変換する。
 * {@code SPRING_DATASOURCE_URL} が既に設定されている場合は何もしない。
 */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

	private static final String SOURCE_NAME = "databaseUrlConversion";

	@Override
	public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
		if (StringUtils.hasText(System.getenv("SPRING_DATASOURCE_URL"))) {
			return;
		}
		String databaseUrl = System.getenv("DATABASE_URL");
		if (!StringUtils.hasText(databaseUrl)) {
			return;
		}
		String trimmed = databaseUrl.trim();
		if (!trimmed.startsWith("postgres")) {
			return;
		}
		Map<String, Object> map = new HashMap<>();
		URI httpsUri = toHttpsUriForParsing(trimmed);
		String host = httpsUri.getHost();
		if (!StringUtils.hasText(host)) {
			throw new IllegalStateException("DATABASE_URL にホストがありません");
		}
		int port = httpsUri.getPort() > 0 ? httpsUri.getPort() : 5432;
		String path = httpsUri.getPath();
		if (!StringUtils.hasText(path) || "/".equals(path)) {
			throw new IllegalStateException("DATABASE_URL にデータベース名（パス）がありません");
		}
		String database = path.startsWith("/") ? path.substring(1) : path;
		StringBuilder jdbc = new StringBuilder();
		jdbc.append("jdbc:postgresql://").append(host).append(':').append(port).append('/').append(database);
		if (StringUtils.hasText(httpsUri.getQuery())) {
			jdbc.append('?').append(httpsUri.getQuery());
		}
		map.put("spring.datasource.url", jdbc.toString());

		String userInfo = httpsUri.getUserInfo();
		if (StringUtils.hasText(userInfo)) {
			String[] up = userInfo.split(":", 2);
			String user = urlDecode(up[0]);
			map.put("spring.datasource.username", user);
			if (up.length > 1) {
				map.put("spring.datasource.password", urlDecode(up[1]));
			} else {
				map.put("spring.datasource.password", "");
			}
		}

		environment.getPropertySources().addFirst(new MapPropertySource(SOURCE_NAME, map));
	}

	private static String urlDecode(String s) {
		return URLDecoder.decode(s, StandardCharsets.UTF_8);
	}

	/** {@code URI} が {@code postgres} スキームを扱いにくいため、パース用に {@code https} に置き換える。 */
	private static URI toHttpsUriForParsing(String databaseUrl) {
		String rest;
		if (databaseUrl.startsWith("postgresql://")) {
			rest = databaseUrl.substring("postgresql://".length());
		} else if (databaseUrl.startsWith("postgres://")) {
			rest = databaseUrl.substring("postgres://".length());
		} else {
			throw new IllegalStateException("DATABASE_URL は postgres:// または postgresql:// で始まる必要があります");
		}
		return URI.create("https://" + rest);
	}

	@Override
	public int getOrder() {
		return Ordered.LOWEST_PRECEDENCE;
	}
}
