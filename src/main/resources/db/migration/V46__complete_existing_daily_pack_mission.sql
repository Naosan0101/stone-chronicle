-- 「パックを2回引く」ミッション（D_PACK）が、ボーナスパックをカウントしていない不具合があったため救済する。
-- 既に所持している（= user_daily_mission に存在する）ユーザーは達成扱いにする（受け取りはユーザー操作）。
UPDATE user_daily_mission
SET progress = target_count
WHERE mission_code = 'D_PACK'
  AND reward_granted = FALSE
  AND progress < target_count;

