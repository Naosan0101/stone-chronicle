-- 実ファイルの拡張子を .PNG / .JPEG に合わせる（既存 DB 向け）
UPDATE card_definition SET image_file = regexp_replace(image_file, '\.png$', '.PNG', 'i');
UPDATE card_definition SET image_file = regexp_replace(image_file, '\.jpg$', '.JPEG', 'i');
UPDATE card_definition SET image_file = regexp_replace(image_file, '\.jpeg$', '.JPEG', 'i');
