-- 風の魔人: エルフかつアンデッドとして扱う（アプリ側は ELF_UNDEAD を分割判定）
UPDATE card_definition SET attribute = 'ELF_UNDEAD' WHERE id = 14;
