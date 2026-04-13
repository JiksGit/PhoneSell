# 방법 A: 사전 빌드된 JAR을 복사 (권장 - 빠름)
# 사용 전: ./gradlew bootJar 또는 gradle bootJar 실행 필요
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
