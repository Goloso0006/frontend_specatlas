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