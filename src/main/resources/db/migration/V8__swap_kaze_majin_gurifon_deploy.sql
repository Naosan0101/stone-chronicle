-- 風の魔人とグリフォンの配置能力を入れ替え（バランス調整）
UPDATE card_definition
SET ability_deploy_code = 'GURIFON',
    deploy_help         = '相手はストーンを1つ捨てる'
WHERE id = 14;

UPDATE card_definition
SET ability_deploy_code = 'KAZE_MAJIN',
    deploy_help         = 'ストーンを2つ得る'
WHERE id = 17;
