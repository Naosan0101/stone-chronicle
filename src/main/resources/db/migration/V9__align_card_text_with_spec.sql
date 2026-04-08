-- 公式カード一覧（名前/レア/コスト/強さ/効果）に合わせた説明文と配置能力コード

-- 風の魔人(14)=ストーン2つ得る、グリフォン(17)=相手はストーン1つ捨てる（V8の入れ替えを戻す）
UPDATE card_definition
SET ability_deploy_code = 'KAZE_MAJIN',
    deploy_help         = 'ストーンを2つ得る'
WHERE id = 14;

UPDATE card_definition
SET ability_deploy_code = 'GURIFON',
    deploy_help         = '相手はストーンを１つ捨てる'
WHERE id = 17;

UPDATE card_definition SET deploy_help = '相手のデッキの上からカードを1枚レストゾーンに置く。デッキにカードがなければ使えない。', passive_help = NULL WHERE id = 1;
UPDATE card_definition SET deploy_help = 'ストーン1個を使用してもよい。使用したなら、相手は手札からカードを1枚選んで、レストゾーンに置く。', passive_help = NULL WHERE id = 2;
UPDATE card_definition SET deploy_help = 'ストーン1個を使用してもよい。使用したなら、自分のレストゾーンのカード1枚と、手札のカード1枚を選んで、交換する。', passive_help = NULL WHERE id = 3;
UPDATE card_definition SET deploy_help = 'このカードがレベルアップするとき+される強さは+2ではなく+3。', passive_help = NULL WHERE id = 4;
UPDATE card_definition SET deploy_help = 'お互のプレイヤーは、手札からカードを1枚選んで、レストゾーンに置く。', passive_help = NULL WHERE id = 5;
UPDATE card_definition SET deploy_help = 'ストーン1個を使用してもよい。使用したなら、相手と強さを逆転させる。', passive_help = NULL WHERE id = 6;
UPDATE card_definition SET deploy_help = 'コストとして使用したカードが「オオカミ」なら、その「オオカミ」とこのカードを入れ替える。「オオカミ」でないなら、何も起きない。', passive_help = NULL WHERE id = 7;
UPDATE card_definition SET deploy_help = NULL, passive_help = '所持しているストーン1つにつき、相手のファイターの強さ-1。' WHERE id = 8;
UPDATE card_definition SET deploy_help = '相手の手札から、カードをランダムに1枚選び、デッキの一番上に置く。', passive_help = NULL WHERE id = 9;
UPDATE card_definition SET deploy_help = NULL, passive_help = '自分のレストゾーンに「属性：ドラゴン」があるなら、強さ+4。' WHERE id = 10;
UPDATE card_definition SET deploy_help = '次に自分がバトルゾーンに配置するファイターの強さに+2。', passive_help = NULL WHERE id = 11;
UPDATE card_definition SET deploy_help = NULL, passive_help = '相手が「属性：ドラゴン」以外なら、強さ+1。' WHERE id = 12;
UPDATE card_definition SET deploy_help = '次に自分がバトルゾーンに配置するファイターが「属性：エルフ」なら、そのファイターの強さに+4。', passive_help = NULL WHERE id = 13;
UPDATE card_definition SET deploy_help = NULL, passive_help = NULL WHERE id = 15;
UPDATE card_definition SET deploy_help = '自分のレストゾーンからカードを1枚選んで、手札に加える。', passive_help = NULL WHERE id = 16;
UPDATE card_definition SET deploy_help = NULL, passive_help = '相手が「属性：エルフ」なら、強さ+2。' WHERE id = 18;
UPDATE card_definition SET deploy_help = '自分のレストゾーンから、カードをランダムに1枚選び、デッキに加えてシャッフルする。', passive_help = NULL WHERE id = 19;
UPDATE card_definition SET deploy_help = NULL, passive_help = '相手が「属性：人間」以外なら、強さ+1。' WHERE id = 20;
UPDATE card_definition SET deploy_help = NULL, passive_help = NULL WHERE id = 21;
UPDATE card_definition SET deploy_help = 'ストーン1個を使用してもよい。使用したなら、このファイターは次のターン、レストゾーンに置かれず、手札の一番左にもどる。', passive_help = NULL WHERE id = 22;
UPDATE card_definition SET deploy_help = 'ストーン1個を使用してもよい。使用したなら、自分のレストゾーンに「二度寝ゾンビ」がいるなら、そのカードをデッキの一番下に置く。', passive_help = NULL WHERE id = 23;
UPDATE card_definition SET deploy_help = NULL, passive_help = '自分のレストゾーンにある「種族：アンデッド」1枚につき、強さ+1。' WHERE id = 24;
UPDATE card_definition SET deploy_help = NULL, passive_help = NULL WHERE id = 25;
UPDATE card_definition SET deploy_help = '相手のファイターをレストゾーンに置く。', passive_help = NULL WHERE id = 26;
UPDATE card_definition SET deploy_help = 'ストーン2個を使用してもよい。使用したなら、自分のレストゾーンにある「種族：ドラゴン」を1枚選んで、手札に加える。', passive_help = NULL WHERE id = 27;
UPDATE card_definition SET deploy_help = '相手が「種族：ドラゴン」なら、そのカードをレストゾーンに置く。', passive_help = NULL WHERE id = 28;
UPDATE card_definition SET deploy_help = 'ストーン1個を使用してもよい。使用したなら、自分のレストゾーンにある「種族：エルフ」1枚につき、強さ+1。', passive_help = NULL WHERE id = 29;
UPDATE card_definition SET deploy_help = NULL, passive_help = '相手のファイターは配置能力と常時能力が使えない。' WHERE id = 30;
