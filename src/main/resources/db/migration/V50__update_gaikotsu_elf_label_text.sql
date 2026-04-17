-- がいこつ兵(18): 効果テキストの「属性：エルフ」→「種族：エルフ」

UPDATE card_definition
SET passive_help = '相手が「種族：エルフ」なら、強さ+2。'
WHERE id = 18;
