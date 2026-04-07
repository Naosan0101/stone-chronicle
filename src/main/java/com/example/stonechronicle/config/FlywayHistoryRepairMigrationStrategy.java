package com.example.stonechronicle.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import javax.sql.DataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Flyway が「V1 適用済み」と記録しているのに {@code app_user} が無い不整合があると V2 が失敗する。
 * その場合のみ履歴の 1 / 2 を削除し、マイグレーションを最初からやり直す（中身が空の DB 向け）。
 * <p>
 * その後 {@link Flyway#repair()} で、既に適用済みマイグレーションのファイルをローカルで編集したときの
 * チェックサム不一致を {@code flyway_schema_history} 側に合わせて解消する（起動不能の回避）。
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class FlywayHistoryRepairMigrationStrategy {

	private final DataSource dataSource;

	@Bean
	FlywayMigrationStrategy flywayMigrationStrategy() {
		return flyway -> {
			try (Connection c = dataSource.getConnection()) {
				repairIfNeeded(c);
			} catch (SQLException e) {
				throw new IllegalStateException("Flyway 事前修復で DB に接続できませんでした", e);
			}
			flyway.repair();
			flyway.migrate();
		};
	}

	private void repairIfNeeded(Connection c) throws SQLException {
		if (!tableExists(c, "flyway_schema_history")) {
			return;
		}
		if (tableExists(c, "app_user")) {
			return;
		}
		if (!historyHasSuccessfulVersion(c, "1")) {
			return;
		}
		int otherTables = countUserTablesExcluding(c, "flyway_schema_history");
		if (otherTables > 0) {
			log.error(
					"Flyway は version 1 を適用済みですが app_user がありません。"
							+ " 他に {} 個のユーザーテーブルがあるため自動修復しません。"
							+ " scripts/reset-springdb-public-schema.sql を実行するか、手でスキーマを整合させてください。",
					otherTables);
			return;
		}
		log.warn(
				"Flyway 履歴に version 1 がありますが app_user がありません。"
						+ " flyway_schema_history から version 1,2 を削除し、マイグレーションを再実行します。");
		try (Statement st = c.createStatement()) {
			st.executeUpdate("DELETE FROM flyway_schema_history WHERE version IN ('1', '2')");
		}
	}

	private static boolean historyHasSuccessfulVersion(Connection c, String version) throws SQLException {
		try (PreparedStatement ps = c.prepareStatement(
				"SELECT 1 FROM flyway_schema_history WHERE version = ? AND success = TRUE LIMIT 1")) {
			ps.setString(1, version);
			try (ResultSet rs = ps.executeQuery()) {
				return rs.next();
			}
		}
	}

	private static int countUserTablesExcluding(Connection c, String excludeTable) throws SQLException {
		String schema = c.getSchema();
		if (schema == null) {
			schema = "public";
		}
		try (PreparedStatement ps = c.prepareStatement(
				"SELECT COUNT(*) FROM information_schema.tables "
						+ "WHERE table_schema = ? AND table_type = 'BASE TABLE' AND LOWER(table_name) <> LOWER(?)")) {
			ps.setString(1, schema);
			ps.setString(2, excludeTable);
			try (ResultSet rs = ps.executeQuery()) {
				rs.next();
				return rs.getInt(1);
			}
		}
	}

	private static boolean tableExists(Connection c, String tableName) throws SQLException {
		DatabaseMetaData meta = c.getMetaData();
		String schema = c.getSchema();
		String catalog = c.getCatalog();
		try (ResultSet rs = meta.getTables(catalog, schema, tableName, new String[] {"TABLE"})) {
			return rs.next();
		}
	}
}
