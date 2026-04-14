-- ダークドラゴン(28): 効果テキストの文順を仕様に合わせる
UPDATE card_definition
SET deploy_help = 'ストーンを2つ得る。相手が「種族：ドラゴン」なら、そのカードをレストゾーンに置く。'
WHERE id = 28;

