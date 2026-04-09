-- エルフの巫女(11): 次回配置ボーナスを +2 → +1 に仕様変更（表示テキストも更新）
UPDATE card_definition
SET deploy_help = '次に自分がバトルゾーンに配置するファイターの強さに+1。'
WHERE id = 11;

