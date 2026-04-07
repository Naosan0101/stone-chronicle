-- レア度の追加と、風の魔人/グリフォンの説明文修正
ALTER TABLE card_definition
  ADD COLUMN IF NOT EXISTS rarity VARCHAR(4) NOT NULL DEFAULT 'C';

-- 風の魔人/グリフォン: 能力入れ替え（バランス調整）
UPDATE card_definition
SET deploy_help = 'ストーンを2つ得る'
WHERE id = 14;

UPDATE card_definition
SET deploy_help = '相手はストーンを1つ捨てる'
WHERE id = 17;

-- レア度（C/R/Ep/Reg）
UPDATE card_definition SET rarity = 'C' WHERE id IN (1,3,4,8,9,11,12,18,23,24,25,27,28);
UPDATE card_definition SET rarity = 'R' WHERE id IN (5,6,13,16,19,20,29);
UPDATE card_definition SET rarity = 'Ep' WHERE id IN (7,10,15,17,21,26);
UPDATE card_definition SET rarity = 'Reg' WHERE id IN (2,14,22,30);

