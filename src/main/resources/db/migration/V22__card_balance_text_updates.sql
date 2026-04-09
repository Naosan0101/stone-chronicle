-- カード調整（表記・ヘルプ・数値）
-- エルフの巫女(11): 任意でストーン1消費 → 次回配置+1
-- ウッドエルフ(13): 任意でストーン1消費 → 次回エルフ配置+3
-- 風の魔人(14): 基礎強さ 4 → 3
-- ピクシー(16): 任意でストーン1消費 → レストから1枚選び手札へ

UPDATE card_definition
SET deploy_help = '次に自分がバトルゾーンに配置するファイターの強さに+1。'
WHERE id = 11;

UPDATE card_definition
SET deploy_help = '任意でストーン1消費。次に配置するエルフなら強さ+3'
WHERE id = 13;

UPDATE card_definition
SET base_power = 3
WHERE id = 14;

UPDATE card_definition
SET deploy_help = '任意でストーン1消費。自分のレストから1枚選び手札へ'
WHERE id = 16;

