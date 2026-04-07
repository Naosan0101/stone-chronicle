CREATE TABLE app_user (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  coins INT NOT NULL DEFAULT 6,
  last_mission_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE card_definition (
  id SMALLINT PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE,
  cost SMALLINT NOT NULL,
  base_power SMALLINT NOT NULL,
  attribute VARCHAR(16) NOT NULL,
  image_file VARCHAR(255) NOT NULL,
  ability_deploy_code VARCHAR(64),
  ability_passive_code VARCHAR(64),
  deploy_help TEXT,
  passive_help TEXT
);

CREATE TABLE user_collection (
  user_id BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  card_id SMALLINT NOT NULL REFERENCES card_definition(id),
  quantity INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, card_id),
  CONSTRAINT user_collection_qty_nonneg CHECK (quantity >= 0)
);

CREATE TABLE deck (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  UNIQUE (user_id, name)
);

CREATE TABLE deck_entry (
  deck_id BIGINT NOT NULL REFERENCES deck(id) ON DELETE CASCADE,
  slot SMALLINT NOT NULL,
  card_id SMALLINT NOT NULL REFERENCES card_definition(id),
  PRIMARY KEY (deck_id, slot),
  CONSTRAINT deck_entry_slot CHECK (slot BETWEEN 1 AND 8)
);

CREATE TABLE user_daily_mission (
  user_id BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  mission_date DATE NOT NULL,
  slot SMALLINT NOT NULL,
  mission_code VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  target_count INT NOT NULL,
  progress INT NOT NULL DEFAULT 0,
  reward_granted BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, mission_date, slot),
  CONSTRAINT user_daily_mission_slot CHECK (slot IN (1, 2, 3))
);

CREATE INDEX idx_deck_user ON deck(user_id);
CREATE INDEX idx_user_collection_user ON user_collection(user_id);

INSERT INTO card_definition (id, name, cost, base_power, attribute, image_file, ability_deploy_code, ability_passive_code, deploy_help, passive_help) VALUES
(1, '策士', 0, 2, 'HUMAN', '策士.PNG', 'SAKUSHI', NULL, '相手デッキの上から1枚をレストゾーンへ（デッキがなければ不可）', NULL),
(2, 'サムライ', 1, 3, 'HUMAN', 'サムライ.PNG', 'SAMURAI', NULL, '任意でストーン1消費。使用時、相手は手札から1枚レストへ', NULL),
(3, '工作員', 0, 1, 'HUMAN', '工作員.PNG', 'KOSAKUIN', NULL, '任意でストーン1消費。使用時、自分のレスト1枚と手札1枚を交換', NULL),
(4, '賞金稼ぎ', 0, 1, 'HUMAN', '賞金稼ぎ.PNG', 'SHOKIN', NULL, 'レベルアップで強さが+2ではなく+3', NULL),
(5, '剣闘士', 2, 5, 'HUMAN', '剣闘士.PNG', 'KENTOSHI', NULL, 'お互い手札から1枚ずつレストへ', NULL),
(6, '科学者', 1, 2, 'HUMAN', '科学者.PNG', 'KAGAKUSHA', NULL, '任意でストーン1消費。使用時、お互いの強さを入れ替え', NULL),
(7, 'オオカミ男', 1, 0, 'HUMAN', 'オオカミ男.PNG', 'OKAMI_OTOKO', NULL, 'コストに「オオカミ」を使った場合、そのカードと入れ替え', NULL),
(8, '薬売り', 0, 2, 'HUMAN', '薬売り.PNG', NULL, 'KUSURI', NULL, '所持ストーン1つにつき相手ファイター強さ-1'),
(9, '狩人', 1, 3, 'HUMAN', '狩人.PNG', 'KARYUDO', NULL, '相手手札からランダム1枚をデッキの一番上へ', NULL),
(10, 'ドラゴンライダー', 2, 2, 'HUMAN', 'ドラゴンライダー.PNG', NULL, 'DRAGON_RIDER', NULL, '自分のレストにドラゴンがいれば強さ+4'),
(11, '巫女', 0, 2, 'ELF', '巫女.PNG', 'MIKO', NULL, '次に自分が配置するファイター強さ+2', NULL),
(12, 'アーチャー', 1, 3, 'ELF', 'アーチャー.PNG', NULL, 'ARCHER', NULL, '相手がドラゴン以外なら強さ+1'),
(13, '妖精', 0, 1, 'ELF', '妖精.PNG', 'YOSEI', NULL, '次に配置するエルフなら強さ+4', NULL),
(14, '風の魔人', 1, 4, 'ELF_UNDEAD', '風の魔人.PNG', 'KAZE_MAJIN', NULL, '相手はストーンを1つ捨てる', NULL),
(15, '森の守護者', 2, 6, 'ELF', '森の守護者.PNG', NULL, NULL, NULL, NULL),
(16, 'きのこ拾い', 0, 1, 'ELF', 'きのこ拾い.PNG', 'KINOKO', NULL, '自分のレストから1枚選び手札へ', NULL),
(17, 'グリフォン', 0, 2, 'ELF', 'グリフォン.PNG', 'GURIFON', NULL, 'ストーンを2つ得る', NULL),
(18, 'がいこつ兵', 0, 2, 'UNDEAD', 'がいこつ兵.PNG', NULL, 'GAIKOTSU', NULL, '相手がエルフなら強さ+2'),
(19, '呪われた亡者', 0, 1, 'UNDEAD', '呪われた亡者.PNG', 'NOROWARETA', NULL, '自分レストからランダム1枚をデッキに戻しシャッフル', NULL),
(20, '死霊騎士', 2, 4, 'UNDEAD', '死霊騎士.PNG', NULL, 'SHIREI', NULL, '相手が人間以外なら強さ+1'),
(21, 'オオカミ', 2, 5, 'UNDEAD', 'オオカミ.PNG', NULL, NULL, NULL, NULL),
(22, 'ふわふわゴースト', 1, 2, 'UNDEAD', 'ふわふわゴースト.PNG', 'FUWAFUWA', NULL, '任意でストーン1消費。使用時、次の自分ターン開始までレストに行かず手札左端へ', NULL),
(23, '二度寝ゾンビ', 1, 2, 'UNDEAD', '二度寝ゾンビ.PNG', 'NIDONEBI', NULL, '任意でストーン1消費。使用時、レストに二度寝ゾンビがいればデッキ最下段へ', NULL),
(24, '骨ダンサー', 0, 1, 'UNDEAD', '骨ダンサー.PNG', NULL, 'HONE', NULL, '自分のレストのアンデッド1枚につき強さ+1'),
(25, 'ドラゴン', 1, 4, 'DRAGON', 'ドラゴン.PNG', NULL, NULL, NULL, NULL),
(26, '火炎竜', 2, 2, 'DRAGON', '火炎竜.PNG', 'KAENRYU', NULL, '相手ファイターをレストへ', NULL),
(27, 'ドラゴンの卵', 0, 1, 'DRAGON', 'ドラゴンの卵.PNG', 'RYUNOTAMAGO', NULL, '任意でストーン2消費。使用時、レストのドラゴン1枚を手札へ', NULL),
(28, 'ダークドラゴン', 2, 5, 'DRAGON', 'ダークドラゴン.PNG', 'DAKU_DORAGON', NULL, '相手がドラゴンならレストへ', NULL),
(29, '古竜', 2, 3, 'DRAGON', '古竜.PNG', 'KORYU', NULL, '任意でストーン1消費。使用時、レストのエルフ1枚につき強さ+1', NULL),
(30, '竜王', 1, 3, 'DRAGON', '竜王.PNG', NULL, 'RYUOH', NULL, '相手ファイターは配置・常時能力が無効');
