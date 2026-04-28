---

# 5) `README-Proxy.md`

```md
# Proxy Pattern en el Frontend de SpecAtlas

## Objetivo
El patrón Proxy se usa para encapsular el acceso a la API y controlar:
- autenticación
- headers
- manejo de errores
- cache
- logging
- reintentos

En frontend, normalmente se implementa con un cliente HTTP centralizado.

## Por qué usarlo
Porque cada request al backend comparte lógica común:
- enviar JWT
- manejar `401`
- manejar `403`
- evitar repetir código en cada servicio

## Backend relacionado
Archivos importantes:
- `src/main/java/com/specatlas/backend/infrastructure/security/SecurityConfig.java`
- `src/main/java/com/specatlas/backend/infrastructure/security/JwtAuthFilter.java`
- `src/main/java/com/specatlas/backend/infrastructure/controller/AuthController.java`

Tu backend usa:
- autenticación JWT
- CORS
- endpoints públicos y protegidos

## Dónde usarlo
En:
- `httpClient`
- interceptores Axios
- wrapper de `fetch`
- capa base de acceso a API

## Estructura sugerida
```text
src/
  api/
    httpClient.ts
    auth.api.ts
    requirement.api.ts
    diagram.api.ts
    graph.api.ts


Ejemplo con Axios

import axios from 'axios';

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // limpiar sesión o redirigir al login
    }
    return Promise.reject(error);
  }
);


Recomendaciones
No llames a la API directamente desde componentes.
Usa un solo cliente HTTP para toda la app.
Centraliza el manejo de 401 y 403.
Usa variables de entorno para la URL del backend.
Mantén la lógica de auth y headers en el proxy.
Caso ideal en SpecAtlas
Cualquier llamada a:


/requirements/project/{projectId}
/api/diagrams/project/{projectId}
/api/graph/impact/{id}
debe pasar por el proxy HTTP y llevar el JWT automáticamente.
Beneficio final
El Proxy hace que la comunicación con el backend sea más limpia, consistente y segura.