-- サムライ: 効果文を更新（ストーン2／相手手札2枚）
UPDATE card_definition
SET deploy_help = 'ストーン2個を使用してもよい。使用したなら、相手は手札からカードを2枚選んで、レストゾーンに置く。'
WHERE id = 2;

