package com.example.stonechronicle;

import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.Locale;
import org.springframework.web.util.UriUtils;

/**
 * 静的画像 URL（{@code /images/cards/…}）。参照時は NFD に正規化しリソース名と一致させる。拡張子は {@code .PNG} / {@code .JPEG} にそろえる。
 */
public final class GameConstants {
	public static final String CARD_ASSET_DIR = "/images/cards/";

	private static String normalizeImageExtension(String filename) {
		if (filename == null || filename.isBlank()) {
			return filename;
		}
		int dot = filename.lastIndexOf('.');
		if (dot < 0) {
			return filename;
		}
		String base = filename.substring(0, dot);
		String ext = filename.substring(dot).toLowerCase(Locale.ROOT);
		if (ext.equals(".png")) {
			return base + ".PNG";
		}
		if (ext.equals(".jpg") || ext.equals(".jpeg")) {
			return base + ".JPEG";
		}
		return base + filename.substring(dot).toUpperCase(Locale.ROOT);
	}

	/**
	 * クラスパス上の実ファイル名（Git / macOS 由来は NFD になりやすい）と一致させる。
	 * NFC のまま URL 化すると、エントリ名が NFD の JAR 内リソースと一致せず 404 になる。
	 */
	private static String encCardFile(String filename) {
		if (filename == null || filename.isBlank()) {
			return "";
		}
		String trimmed = filename.trim();
		String nfd = Normalizer.normalize(trimmed, Normalizer.Form.NFD);
		String normalized = normalizeImageExtension(nfd);
		return CARD_ASSET_DIR + UriUtils.encodePathSegment(normalized, StandardCharsets.UTF_8);
	}

	/**
	 * リポジトリ内の固定 PNG（カードうら・パック絵など）用。Windows ではファイル名が NFC のことが多く、{@link #encCardFile} だと 404 になる。
	 */
	private static String encCardFileNfc(String filename) {
		if (filename == null || filename.isBlank()) {
			return "";
		}
		String normalized = normalizeImageExtension(filename.trim());
		return CARD_ASSET_DIR + UriUtils.encodePathSegment(normalized, StandardCharsets.UTF_8);
	}

	/** ①カード基盤 */
	public static final String CARD_LAYER_BASE = encCardFile("カード基盤.PNG");

	/** ③カード基礎データ（装飾・枠・最前面の画像レイヤー） */
	public static final String CARD_LAYER_DATA = encCardFile("カード基礎データ.PNG");

	/** ②種族バー */
	public static String cardLayerBarPath(String attribute) {
		String file = switch (attribute == null || attribute.isBlank() ? "HUMAN" : attribute.toUpperCase(Locale.ROOT)) {
			case "HUMAN" -> "人間バー.PNG";
			case "ELF" -> "エルフバー.PNG";
			case "UNDEAD" -> "アンデッドバー.PNG";
			case "DRAGON" -> "ドラゴンバー.PNG";
			case "ELF_UNDEAD" -> "エルフアンデッドバー.PNG";
			default -> "人間バー.PNG";
		};
		return encCardFile(file);
	}

	/** キャライラスト（DB image_file）。拡張子は .PNG / .JPEG に正規化。 */
	public static String cardPortraitPath(String imageFile) {
		if (imageFile == null || imageFile.isBlank()) {
			return "";
		}
		return encCardFile(imageFile);
	}

	/**
	 * カード面のイラスト層（①基盤と種族バーの間）。種族が単一の次のいずれかのときのみ:
	 * {@code HUMAN} / {@code ELF} / {@code UNDEAD} / {@code ELF_UNDEAD} / {@code DRAGON}。
	 * 素材ファイル名はカード名と一致する {@code 名前.PNG}。
	 */
	public static String namedTribePortraitLayerPath(String attribute, String cardName) {
		if (attribute == null || cardName == null) {
			return "";
		}
		String attr = attribute.trim().toUpperCase(Locale.ROOT);
		if (!attr.equals("HUMAN")
				&& !attr.equals("ELF")
				&& !attr.equals("UNDEAD")
				&& !attr.equals("ELF_UNDEAD")
				&& !attr.equals("DRAGON")) {
			return "";
		}
		String n = cardName.trim();
		if (n.isEmpty()) {
			return "";
		}
		return encCardFile(n + ".PNG");
	}

	/** ASCII 名に統一（Git が NFD の「カードうら.PNG」だと URL 解決が環境で不一致になりやすい）。 */
	public static final String CARD_BACK_FILE = "card-back.PNG";

	public static String cardBackUrl() {
		return encCardFileNfc(CARD_BACK_FILE);
	}

	public static final String CARD_PACK_FILE = "カードパック_イラスト.JPEG";

	public static String packImageUrl() {
		return encCardFile(CARD_PACK_FILE);
	}

	/**
	 * 購入一覧など、{@code /images/cards/} 配下のパックアート用。{@link #encCardFileNfc} と同じく NFC で URL を組む。
	 */
	public static String packArtImageUrl(String filename) {
		return encCardFileNfc(filename);
	}

	/** 新規登録直後の所持ジェム（初回ホームでウェルカムボーナス） */
	public static final int STARTING_COINS = 0;

	/** 初めてホームを開いたときに一度だけ付与 */
	public static final int WELCOME_HOME_BONUS_GEMS = 30;
	public static final int PACK_COST = 3;
	public static final int PACK_CARD_COUNT = 4;
	public static final int MISSION_REWARD_COINS = 3;

	/** ウィークリーミッション1件あたり（デイリーの約2倍） */
	public static final int MISSION_WEEKLY_REWARD_COINS = 6;

	private GameConstants() {
	}
}
