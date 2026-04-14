package com.example.nineuniverse.web;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.info.BuildProperties;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

/**
 * Thymeleaf の {@code @{/css/app.css(v=${assetVersion})}} 用。
 * 本番の {@code max-age=7d} でも、デプロイのたびに URL が変わりブラウザが新しい静的ファイルを取りにいく。
 */
@ControllerAdvice
public class AssetVersionAdvice {

	private final String assetVersion;

	public AssetVersionAdvice(ObjectProvider<BuildProperties> buildProperties) {
		BuildProperties bp = buildProperties.getIfAvailable();
		if (bp != null && bp.getTime() != null) {
			this.assetVersion = Long.toString(bp.getTime().toEpochMilli());
		} else {
			this.assetVersion = "dev";
		}
	}

	@ModelAttribute("assetVersion")
	public String assetVersion() {
		return assetVersion;
	}
}
