-- 工作員(3) → 用心棒: 数値変更＆効果なし
-- 賞金稼ぎ(4) → 隊長: 数値変更＆新配置効果

UPDATE card_definition
SET name = '用心棒',
    cost = 3,
    base_power = 7,
    ability_deploy_code = NULL,
    deploy_help = '効果なし。'
WHERE id = 3;

UPDATE card_definition
SET name = '隊長',
    cost = 1,
    base_power = 3,
    ability_deploy_code = 'SHOKIN',
    deploy_help = '次に自分が配置するファイターは、そのファイターのコストに等しい数だけ強さを+する'
WHERE id = 4;

