FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /workspace/server
COPY server/gradlew server/build.gradle server/settings.gradle ./
COPY server/gradle ./gradle
COPY server/src ./src
COPY config /workspace/config
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S itrend && adduser -S -G itrend -u 10001 itrend
WORKDIR /app
COPY --from=build --chown=itrend:itrend /workspace/server/build/libs/*.jar app.jar

USER 10001
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
