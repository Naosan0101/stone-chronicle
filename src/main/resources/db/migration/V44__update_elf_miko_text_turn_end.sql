-- エルフの巫女(11): 効果テキストを「ターンの終わりまで」に合わせる
UPDATE card_definition
SET deploy_help = '次に自分がバトルゾーンに配置するファイターは、ターンの終わりまで、強さ+1。'
WHERE id = 11;

