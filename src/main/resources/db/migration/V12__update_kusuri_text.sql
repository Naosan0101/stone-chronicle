-- 薬売り: テキストを「自分が所持しているストーン」に合わせる
UPDATE card_definition
SET passive_help = '自分が所持しているストーン1つにつき、相手のファイターの強さ-1'
WHERE id = 8;

