-- 古竜: 効果文を「次の相手ターン終了まで」に更新
UPDATE card_definition
SET deploy_help = '任意でストーン1消費。使用したなら、次の相手ターン終了まで、レストのエルフ1枚につき強さ+1'
WHERE id = 29;

