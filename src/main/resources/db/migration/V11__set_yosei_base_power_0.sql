-- ウッドエルフ(13): ゲームバランス調整で基礎強さを 0 に
UPDATE card_definition SET base_power = 0 WHERE id = 13;

