-- 竜王(30): 効果テキストを記法合わせ（〈配置〉/〈常時〉）に修正

UPDATE card_definition
SET passive_help = '相手のファイターは〈配置〉効果と〈常時〉効果が使えない。'
WHERE id = 30;

