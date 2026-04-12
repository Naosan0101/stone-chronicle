# syntax=docker/dockerfile:1
# docker compose の app サービス用（マルチステージで bootJar を作成）
FROM eclipse-temurin:25-jdk-noble AS builder
WORKDIR /app
COPY gradlew gradlew.bat ./
COPY gradle ./gradle
COPY build.gradle settings.gradle ./
COPY src ./src
RUN chmod +x gradlew \
	&& ./gradlew bootJar --no-daemon -x test \
	&& JAR="$(find /app/build/libs -maxdepth 1 -name '*-SNAPSHOT.jar' ! -name '*-plain.jar' -print -quit)" \
	&& test -n "$JAR" \
	&& cp "$JAR" /opt/app.jar

FROM eclipse-temurin:25-jre-noble
WORKDIR /app
COPY --from=builder /opt/app.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
