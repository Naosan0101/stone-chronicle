package com.example.nineuniverse;

import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
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

	/** お知らせ配布（処理軽量化リリース記念）の識別子。 */
	public static final String ANNOUNCEMENT_PERF_LIGHT_KEY = "perf_light_2026_04";

	public static final int ANNOUNCEMENT_PERF_LIGHT_GEMS = 10;

	/** 受け取り開始日（この日を含む）。 */
	public static final LocalDate ANNOUNCEMENT_PERF_LIGHT_START = LocalDate.of(2026, 4, 14);

	/**
	 * 受け取り終了日（この日を含む）。開始日から 30 日間。
	 */
	public static final LocalDate ANNOUNCEMENT_PERF_LIGHT_LAST_DAY =
			ANNOUNCEMENT_PERF_LIGHT_START.plusDays(30 - 1);

	/** お知らせ配布（時間パックゲージ実装のお知らせ） */
	public static final String ANNOUNCEMENT_TIME_PACK_KEY = "time_pack_gauge_2026_04";

	public static final int ANNOUNCEMENT_TIME_PACK_GEMS = 10;

	public static final LocalDate ANNOUNCEMENT_TIME_PACK_START = LocalDate.of(2026, 4, 14);

	public static final LocalDate ANNOUNCEMENT_TIME_PACK_LAST_DAY =
			ANNOUNCEMENT_TIME_PACK_START.plusDays(30 - 1);

	/** お知らせ配布（UI・ミッション見直し＆カードバランス調整） */
	public static final String ANNOUNCEMENT_BALANCE_UI_MISSION_KEY = "balance_ui_mission_2026_04";

	public static final int ANNOUNCEMENT_BALANCE_UI_MISSION_GEMS = 10;

	public static final LocalDate ANNOUNCEMENT_BALANCE_UI_MISSION_START = LocalDate.of(2026, 4, 14);

	public static final LocalDate ANNOUNCEMENT_BALANCE_UI_MISSION_LAST_DAY =
			ANNOUNCEMENT_BALANCE_UI_MISSION_START.plusDays(30 - 1);

	/** お知らせ配布（カードパック排出率調整） */
	public static final String ANNOUNCEMENT_PACK_RATES_KEY = "pack_rates_2026_04";

	public static final int ANNOUNCEMENT_PACK_RATES_GEMS = 3;

	public static final LocalDate ANNOUNCEMENT_PACK_RATES_START = LocalDate.of(2026, 4, 14);

	public static final LocalDate ANNOUNCEMENT_PACK_RATES_LAST_DAY =
			ANNOUNCEMENT_PACK_RATES_START.plusDays(30 - 1);

	/** お知らせ配布（パック結果「もう一度引く」ボタン追加） */
	public static final String ANNOUNCEMENT_PACK_RESULT_DRAW_AGAIN_KEY = "pack_result_draw_again_2026_04";

	public static final int ANNOUNCEMENT_PACK_RESULT_DRAW_AGAIN_GEMS = 5;

	public static final LocalDate ANNOUNCEMENT_PACK_RESULT_DRAW_AGAIN_START = LocalDate.of(2026, 4, 14);

	public static final LocalDate ANNOUNCEMENT_PACK_RESULT_DRAW_AGAIN_LAST_DAY =
			ANNOUNCEMENT_PACK_RESULT_DRAW_AGAIN_START.plusDays(30 - 1);

	/** お知らせ配布（「隊長」カードのテキスト修正） */
	public static final String ANNOUNCEMENT_CAPTAIN_TEXT_KEY = "captain_text_2026_04";

	public static final int ANNOUNCEMENT_CAPTAIN_TEXT_GEMS = 5;

	public static final LocalDate ANNOUNCEMENT_CAPTAIN_TEXT_START = LocalDate.of(2026, 4, 14);

	public static final LocalDate ANNOUNCEMENT_CAPTAIN_TEXT_LAST_DAY =
			ANNOUNCEMENT_CAPTAIN_TEXT_START.plusDays(30 - 1);

	/** お知らせ配布（ミッション達成不具合の修正） */
	public static final String ANNOUNCEMENT_MISSION_FIX_KEY = "mission_fix_2026_04";

	public static final int ANNOUNCEMENT_MISSION_FIX_GEMS = 5;

	public static final LocalDate ANNOUNCEMENT_MISSION_FIX_START = LocalDate.of(2026, 4, 14);

	public static final LocalDate ANNOUNCEMENT_MISSION_FIX_LAST_DAY =
			ANNOUNCEMENT_MISSION_FIX_START.plusDays(30 - 1);

	/** お知らせ配布（カード効果テキスト修正: ダークドラゴン/エルフの巫女/ウッドエルフ） */
	public static final String ANNOUNCEMENT_CARD_TEXT_FIX_KEY = "card_text_fix_2026_04";

	public static final int ANNOUNCEMENT_CARD_TEXT_FIX_GEMS = 5;

	public static final LocalDate ANNOUNCEMENT_CARD_TEXT_FIX_START = LocalDate.of(2026, 4, 14);

	public static final LocalDate ANNOUNCEMENT_CARD_TEXT_FIX_LAST_DAY =
			ANNOUNCEMENT_CARD_TEXT_FIX_START.plusDays(30 - 1);

	/** お知らせ配布（サムライ効果不具合の修正） */
	public static final String ANNOUNCEMENT_SAMURAI_FIX_KEY = "samurai_fix_2026_04";

	public static final int ANNOUNCEMENT_SAMURAI_FIX_GEMS = 3;

	public static final LocalDate ANNOUNCEMENT_SAMURAI_FIX_START = LocalDate.of(2026, 4, 15);

	public static final LocalDate ANNOUNCEMENT_SAMURAI_FIX_LAST_DAY =
			ANNOUNCEMENT_SAMURAI_FIX_START.plusDays(30 - 1);

	/** お知らせ配布（「カードパックを引く」ミッションでボーナスパックがカウントされない不具合の修正） */
	public static final String ANNOUNCEMENT_PACK_MISSION_BONUS_FIX_KEY = "pack_mission_bonus_fix_2026_04";

	public static final int ANNOUNCEMENT_PACK_MISSION_BONUS_FIX_GEMS = 5;

	public static final LocalDate ANNOUNCEMENT_PACK_MISSION_BONUS_FIX_START = LocalDate.of(2026, 4, 15);

	public static final LocalDate ANNOUNCEMENT_PACK_MISSION_BONUS_FIX_LAST_DAY =
			ANNOUNCEMENT_PACK_MISSION_BONUS_FIX_START.plusDays(30 - 1);

	/**
	 * お知らせモーダルで「新規ユーザー」に古い項目を出さないための判定。
	 * 登録からこの日数以内を新規とみなし、{@link #announcementVisibleInNewUserWindow} と組み合わせる。
	 */
	public static final int ANNOUNCEMENT_NEW_USER_ACCOUNT_MAX_AGE_DAYS = 14;

	/** 新規ユーザーには、開始日が「今日から遡ってこの日数以内」のお知らせだけを表示する。 */
	public static final int ANNOUNCEMENT_NEW_USER_VISIBLE_LOOKBACK_DAYS = 14;

	/**
	 * 登録から {@link #ANNOUNCEMENT_NEW_USER_ACCOUNT_MAX_AGE_DAYS} 日以内なら、お知らせ一覧を直近分に制限する対象。
	 */
	public static boolean isNewUserForAnnouncementList(LocalDate today, LocalDateTime createdAt, ZoneId zone) {
		if (createdAt == null || zone == null) {
			return false;
		}
		LocalDate reg = createdAt.atZone(zone).toLocalDate();
		return !reg.isBefore(today.minusDays(ANNOUNCEMENT_NEW_USER_ACCOUNT_MAX_AGE_DAYS));
	}

	/**
	 * 新規ユーザー向けお知らせの表示可否（開始日が直近 {@link #ANNOUNCEMENT_NEW_USER_VISIBLE_LOOKBACK_DAYS} 日以内）。
	 */
	public static boolean announcementVisibleInNewUserWindow(LocalDate today, LocalDate announcementStart) {
		if (today == null || announcementStart == null) {
			return false;
		}
		LocalDate cutoff = today.minusDays(ANNOUNCEMENT_NEW_USER_VISIBLE_LOOKBACK_DAYS);
		return !announcementStart.isBefore(cutoff);
	}

	/** お知らせカードを出すか（既存ユーザーは常に候補を見る／新規は直近開始のものだけ）。 */
	public static boolean shouldListAnnouncementForUser(
			LocalDate today, LocalDateTime userCreatedAt, ZoneId zone, LocalDate announcementStart) {
		if (!isNewUserForAnnouncementList(today, userCreatedAt, zone)) {
			return true;
		}
		return announcementVisibleInNewUserWindow(today, announcementStart);
	}

	/** ホームの無料スタンダードパック用ゲージが MAX になるまでの時間（ミリ秒） */
	public static final long TIME_PACK_CYCLE_DURATION_MS = 12L * 60 * 60 * 1000;

	/**
	 * お知らせの未読バッジ用。文言や項目を増やしたら値を変えてクライアントの既読をリセットする。
	 */
	public static final String ANNOUNCEMENT_UI_EPOCH = "2026-04-16-7";

	private GameConstants() {
	}
}
