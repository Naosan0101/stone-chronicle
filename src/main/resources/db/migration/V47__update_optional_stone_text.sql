-- 任意ストーン消費の効果テキスト: 「ストーン1個/2個」→「ストーンを1個/2個」

UPDATE card_definition
SET deploy_help = 'ストーンを1個使用してもよい。使用したなら、自分のレストゾーンから、カードをランダムに1枚選び、デッキに加えてシャッフルする。'
WHERE id = 19;

UPDATE card_definition
SET deploy_help = 'ストーンを2個使用してもよい。使用したなら、相手は手札からカードを2枚選んで、レストゾーンに置く。'
WHERE id = 2;

UPDATE card_definition
SET deploy_help = 'ストーンを1個使用してもよい。次に自分がバトルゾーンに配置するファイターが「属性：エルフ」なら、ターンの終わりまで、そのファイターの強さに+3。'
WHERE id = 13;

UPDATE card_definition
SET deploy_help = 'ストーンを1個使用してもよい。使用したなら、自分のレストゾーンに「がいこつ兵」がいるなら、そのカードをデッキの一番下に置く。'
WHERE id = 23;

UPDATE card_definition
SET deploy_help = 'ストーンを2個使用してもよい。使用したなら、自分のレストゾーンにある「種族：ドラゴン」を1枚選んで、手札に加える。'
WHERE id = 27;

UPDATE card_definition
SET deploy_help = 'ストーンを1個使用してもよい。使用したなら、このファイターは次のターン、レストゾーンに置かれず、手札にもどる。'
WHERE id = 22;

UPDATE card_definition
SET deploy_help = 'ストーンを1個使用してもよい。使用したなら、次の相手のターンの終わりまで、自分のレストゾーンにある「種族：エルフ」1枚につき、強さ+1。'
WHERE id = 29;

