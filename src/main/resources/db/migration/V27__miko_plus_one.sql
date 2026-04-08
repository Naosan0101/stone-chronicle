-- 巫女(11): 表記を統一（表記と効果を一致させる）
UPDATE card_definition
SET deploy_help = '次に自分がバトルゾーンに配置するファイターの強さに+1。'
WHERE id = 11;

