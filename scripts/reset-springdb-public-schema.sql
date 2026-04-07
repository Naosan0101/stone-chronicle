-- springdb を開発用に空にし、Flyway を V1 からやり直すためのスクリプト。
-- （履歴だけ壊れてテーブルが無い場合は、アプリ側の自動修復でも起動できることがあります。）
-- pgAdmin や DBeaver でデータベース「springdb」に接続して実行してください。
-- springuser に DROP 権限がない場合は、postgres などスーパーユーザで実行し、最後の GRANT はそのまま使えます。

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO springuser;
GRANT ALL ON SCHEMA public TO public;

-- 実行後、アプリを再起動すると Flyway が V1 → V2 を順に適用します。
