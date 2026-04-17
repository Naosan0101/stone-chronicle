-- アーチャー(12)・ドラゴンライダー(10)・死霊騎士(20): 「属性：」→「種族：」表記

UPDATE card_definition
SET passive_help = '自分のレストゾーンに「種族：ドラゴン」があるなら、強さ+4。'
WHERE id = 10;

UPDATE card_definition
SET passive_help = '相手が「種族：ドラゴン」以外なら、強さ+1。'
WHERE id = 12;

UPDATE card_definition
SET passive_help = '相手が「種族：人間」以外なら、強さ+1。'
WHERE id = 20;
