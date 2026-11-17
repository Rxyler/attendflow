# Image pour l'hebergement (Render) : compilation avec Maven, puis execution sur un JRE seul.
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -B dependency:go-offline
COPY src src
RUN ./mvnw -q -B -DskipTests package && cp target/*.jar app.jar

FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/app.jar app.jar
# Offre gratuite : 512 Mo de RAM, on garde la JVM en dessous
# Serveurs en UTC : on force l heure de Tunis (seance en cours, delais de modification, salutations)
ENV TZ=Africa/Tunis
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Xss512k -Duser.timezone=Africa/Tunis"
EXPOSE 8081
CMD ["java", "-jar", "app.jar"]
