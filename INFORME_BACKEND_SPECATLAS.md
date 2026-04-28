# Informe del estado real del backend SpecAtlas

**Fecha:** 2026-04-17  
**Alcance:** revisión rápida del backend `specatlas` enfocada en APIs, PostgreSQL, `pgvector`, seguridad, Neo4j, IA y pruebas.

---

## 1. Resumen ejecutivo

El backend de SpecAtlas **sí tiene una base funcional real** para ser consumida por clientes externos o frontends. No es un proyecto vacío ni un boceto: ya expone controladores REST, maneja autenticación con JWT, persiste información en PostgreSQL, usa búsqueda semántica con `pgvector`, integra Neo4j para análisis de grafo e incorpora Gemini para tareas de IA.

### Veredicto corto
- **Listo para desarrollo e integración:** sí
- **Listo para producción sin ajustes:** no todavía
- **Pensado para PostgreSQL:** sí, completamente
- **Usa `pgvector`:** sí

---

## 2. Estado real del proyecto

### Stack observado
- Java 21
- Spring Boot 3.5.12
- Spring Data JPA
- Spring Security
- JWT
- PostgreSQL
- `pgvector`
- Spring Data Neo4j
- Gemini / IA
- Maven Wrapper

### Interpretación
El proyecto ya tiene una arquitectura bastante avanzada y orientada a producto. Hay separación por capas (`application`, `domain`, `infrastructure`) y ya existen servicios de negocio con integración a bases de datos y servicios externos.

---

## 3. Sobre `pgvector`

Aquí está la aclaración principal: **el proyecto usa `pgvector`, no `jvector`**.

### Evidencia técnica
- En `backend/pom.xml` aparece la dependencia `com.pgvector:pgvector`.
- En `docker-compose.yml` se levanta `pgvector/pgvector:pg16`.
- En `Requirement.java` se define el campo `embedding` con tipo `vector(768)`.
- En `RequirementRepository.java` hay consultas nativas con `CAST(:vector AS vector)`.
- En `RequirementService.java` se genera el embedding y se convierte a literal vectorial para la consulta.

### Conclusión
La búsqueda semántica está pensada para funcionar sobre **PostgreSQL + `pgvector`**, lo cual es coherente y realista para este backend.

---

## 4. PostgreSQL como base principal

Sí, el backend está claramente diseñado alrededor de PostgreSQL.

### Evidencias
- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`
- `spring.datasource.driver-class-name=org.postgresql.Driver`
- `spring.jpa.hibernate.ddl-auto=update`
- `spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect`

### Lo positivo
- Persistencia relacional sólida.
- Uso de JPA y repositorios estándar.
- Integración real con campos vectoriales.

### Lo mejorable
- No se observan migraciones con Flyway o Liquibase.
- `ddl-auto=update` es útil en desarrollo, pero no ideal para producción.
- Hay warnings de Hibernate sobre configuración que conviene limpiar.

---

## 5. APIs expuestas

El backend sí expone APIs REST reales. Los controladores encontrados son:

- `AuthController` → `/api/auth`
- `ProjectController` → `/api/projects`
- `RequirementController` → `/requirements`
- `ValidationRuleController` → `/api/validation-rules`
- `DiagramController` → `/api/diagrams`
- `DiagramManagementController` → `/api/diagrams`
- `GraphController` → `/api/graph`

### Capacidades cubiertas
- login y registro
- CRUD de proyectos
- gestión de requerimientos
- búsqueda semántica
- verificación de duplicados
- reglas de validación
- generación de diagramas
- análisis de impacto
- inferencia de relaciones
- sincronización de grafo con Neo4j

### Observación
Hay una pequeña inconsistencia en el diseño de rutas: algunos endpoints usan prefijo `/api` y otros no. Esto no impide consumirlos, pero sí sugiere que todavía conviene normalizar la convención de rutas.

---

## 6. Seguridad

### Lo que sí existe
- JWT funcional
- `SecurityConfig`
- `JwtAuthFilter`
- `JwtService`
- sesión stateless
- endpoints públicos limitados a autenticación
- CORS configurado

### Lectura real
La seguridad ya es funcional, pero todavía parece orientada a desarrollo o integración más que a un entorno productivo cerrado. Hay algunos puntos a endurecer:
- orígenes CORS hardcodeados
- manejo de errores todavía muy manual en algunas rutas
- mensajes de seguridad de desarrollo en algunos tests

### Conclusión
La seguridad **está implementada**, pero aún necesita pulido para producción.

---

## 7. IA y Gemini

La integración con IA no es decorativa: ya forma parte del flujo funcional del backend.

### Componentes clave
- `IAClient`
- `GeminiService`
- `GeminiAdapter`

### Usos actuales
- convertir texto libre en requisito estructurado
- generar embeddings
- generar UML
- inferir relaciones entre requisitos
- validar requerimientos con reglas
- crear diagramas de clase y casos de uso

### Conclusión
La parte de IA está bastante avanzada y sí aporta valor real al producto.

---

## 8. Neo4j

Neo4j también forma parte de la solución real.

### Qué aporta
- análisis de impacto
- creación de dependencias entre requisitos
- sincronización de nodos
- inferencia y persistencia de relaciones

### Lectura técnica
El proyecto es de persistencia dual:
- PostgreSQL para datos principales
- Neo4j para relaciones y grafo

Eso aporta funcionalidad, pero también complejidad operativa.

### Riesgo asociado
La coexistencia de JPA + Neo4j requiere configuración cuidadosa y entornos bien definidos. En reportes anteriores se observó sensibilidad a variables de entorno de Neo4j, por lo que esta parte debe validarse muy bien en despliegue.

---

## 9. Estado de pruebas

La base de pruebas es buena y el resultado más reciente fue positivo.

### Evidencia observada
En la ejecución reciente del suite:
- **tests ejecutados:** 86
- **failures:** 0
- **errors:** 0

### Cobertura visible
Hay pruebas para:
- autenticación
- seguridad
- controladores REST
- servicios de negocio
- integración con PostgreSQL
- integración con Neo4j
- adaptador de IA / Gemini
- diagramas

### Conclusión
El backend tiene una base de pruebas bastante sólida para su estado actual.

---

## 10. Riesgos y deuda técnica

### Riesgos principales
1. `ddl-auto=update` no es recomendable para producción.
2. Falta una estrategia clara de migraciones de esquema.
3. Hay dependencia fuerte de variables de entorno.
4. La arquitectura dual PostgreSQL + Neo4j aumenta complejidad.
5. Existen warnings de configuración que conviene limpiar.
6. Las rutas de API no están completamente estandarizadas.

### Deuda técnica visible
- normalización de endpoints
- endurecimiento de seguridad
- mejoras en manejo global de errores
- configuración por entorno más robusta
- documentación API más formal

---

## 11. Estado final por categorías

### API y funcionalidad
**Alto**

### Persistencia PostgreSQL
**Alto**

### Búsqueda semántica con `pgvector`
**Alto**

### IA / Gemini
**Alto**

### Neo4j / grafo
**Medio-alto**

### Seguridad de producción
**Media**

### Operación / despliegue
**Media**

### Preparación general para producción
**Media**

---

## 12. Conclusión final

El backend de SpecAtlas **sí está bastante avanzado** y **sí puede ser consumido por APIs**. Tiene las piezas importantes ya montadas: autenticación, persistencia, `pgvector`, grafo, IA y pruebas.

Sin embargo, todavía **no lo consideraría completamente listo para producción** sin algunos ajustes de calidad operativa, migraciones, estandarización y endurecimiento de configuración.

### Semáforo final
- **Desarrollo / integración:** 🟢
- **Demo / validación funcional:** 🟢
- **Producción sin cambios adicionales:** 🟡

### Respuesta directa a tu duda
- **No usa `jvector`**
- **Sí usa `pgvector`**
- **Sí está pensado para PostgreSQL**
- **Sí tiene APIs reales**
- **Sí tiene una base funcional seria**
- **Aún le faltan pulidos para producción**

---

## 13. Recomendación

Si lo vas a presentar o consumir ahora, mi recomendación es:
1. documentarlo mejor,
2. normalizar rutas y configuración,
3. agregar migraciones,
4. validar variables de entorno,
5. y luego hacer un cierre final de producción.

Si quieres, en el siguiente paso te lo convierto en un **informe más ejecutivo y formal**, con portada, introducción, hallazgos, riesgos y conclusión tipo documento para entregar.

---

# SpecAtlas

SpecAtlas es una plataforma asistida por IA para apoyar el análisis, la definición y el diseño de software.
La idea del proyecto es ayudar a transformar ideas o requerimientos en una base más clara y estructurada,
con soporte para persistencia, búsquedas semánticas, análisis de relaciones y generación de artefactos de diseño.

## Estructura general del proyecto

El repositorio está organizado de forma separada por responsabilidades:

- `backend/`: backend principal desarrollado con Spring Boot.
- `docker-compose.yml`: entorno local para levantar los servicios de base de datos que usa el backend.
- `backend/README.md`: documentación técnica y de ejecución del backend.

Dentro de `backend/`, la estructura sigue una separación por capas:

- `application/`: casos de uso, servicios y DTOs.
- `domain/`: modelos y repositorios del dominio.
- `infrastructure/`: controladores, seguridad, configuración y manejo de errores.
- `src/main/resources/`: configuración general del sistema.
- `src/test/`: pruebas automatizadas.

## Flujo esperado del proceso final

El proceso ideal del sistema se vería así:

1. Se levantan los servicios necesarios, como PostgreSQL con `pgvector` y Neo4j.
2. El usuario o frontend consume las APIs del backend para autenticarse y crear proyectos.
3. Los requerimientos se registran, se validan y se convierten en información estructurada.
4. La IA ayuda a generar embeddings, detectar relaciones y producir diagramas o análisis.
5. El sistema guarda la información en PostgreSQL y sincroniza las relaciones relevantes en Neo4j.
6. Finalmente, el frontend consume las respuestas del backend para mostrar análisis, diagramas y resultados al usuario.

---

Primero: define el contrato de integración.
Con la información que me pasaste, el backend ya tiene endpoints suficientes para trabajar. Entonces el siguiente paso no es “hacer pantallas”, sino crear la base de consumo: cliente Axios, rutas centralizadas, tipos TypeScript y manejo de JWT. Eso te evita repetir URLs, inventar respuestas y pelear luego con errores de formato.

Segundo: arma el módulo de autenticación y protección de rutas.
Como el backend ya responde 401 desde SecurityConfig, el frontend debe estar preparado para capturar ese caso, limpiar sesión y redirigir al login. Aquí sí conviene dejar listo el flujo de login, register, guard de rutas y almacenamiento del token.

Tercero: construye el módulo de diagramas como prioridad real.
Por lo que describes, ese es el corazón del sistema. La decisión correcta es usar sourceJson como fuente de verdad y React Flow o similar para visualizar y editar. No empieces por PlantUML como editor principal; úsalo solo como exportación y derivado del JSON.

Cuarto: deja para después proyectos, requisitos y reglas de validación.
Esos módulos también son importantes, pero ya tienen una estructura más clásica de CRUD y son más fáciles de montar cuando la base de API y auth esté estable. El módulo de diagramas, en cambio, sí requiere diseño desde el inicio para no rehacerlo después.

Lo que yo haría ya mismo:

Crear src/api con client, endpoints, interceptors y services.
Crear src/types con los DTOs del backend.
Crear src/store solo para auth y estado del proyecto activo.
Crear el módulo de diagramas con React Flow y sourceJson.
Después montar páginas y layouts.
Sobre backend: no parece que tengas que cambiar mucho si ya expone esas rutas, pero sí debes verificar dos cosas antes de integrar completo:

CORS debe permitir el origen del frontend.
Las respuestas de auth y errores deben ser consistentes para que el interceptor del frontend funcione bien.
Mi recomendación concreta: empieza por la capa API + auth + diagramas. Si haces eso en ese orden, lo demás cae mucho más limpio.
Si quieres, el siguiente paso te lo puedo convertir en una estructura de carpetas exacta para tu proyecto, ya adaptada a SpecAtlas y a esos endpoints reales.