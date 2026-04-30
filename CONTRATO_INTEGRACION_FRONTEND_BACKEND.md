# Contrato de integracion Frontend-Backend (Base de consumo)

**Fecha:** 2026-04-17  
**Proyecto:** SpecAtlas  
**Objetivo:** definir una base estable para consumir las APIs del backend sin duplicar URLs, sin `any` y con manejo consistente de JWT.

---

## 1) Objetivo del contrato

Antes de construir pantallas, el frontend debe tener una capa de integracion clara:

1. **Cliente HTTP unico** (Axios) para todas las llamadas.
2. **Rutas centralizadas** para no hardcodear endpoints en componentes.
3. **Tipos TypeScript** para request/response segun DTOs del backend.
4. **Manejo de JWT** para login, envio de `Authorization` y logout por 401.

Esto evita errores de formato, reduce deuda tecnica y acelera el desarrollo de UI.

---

## 2) Reglas base de integracion

### 2.1 Base URL

- Backend local por defecto: `http://localhost:8080`
- El frontend debe usar `API_BASE_URL` por variable de entorno.

### 2.2 Autenticacion

- `POST /api/auth/login` y `POST /api/auth/register` son publicos.
- El resto de endpoints requiere JWT (`Bearer token`).
- Header esperado:

```http
Authorization: Bearer <token>
```

### 2.3 Formato de respuestas

Hay dos patrones de respuesta en backend:

1. **Directo** (ejemplo `ProjectResponse`, `LoginResponse`, listas simples).
2. **Envoltorio `ApiResponse<T>`** con:
   - `success: boolean`
   - `message: string`
   - `data: T`

El frontend debe soportar ambos patrones.

---

## 3) Endpoints priorizados (contrato inicial)

## 3.1 Auth

### `POST /api/auth/login`

**Request**

```json
{
  "email": "user@mail.com",
  "password": "string"
}
```

**Response 200 (`LoginResponse`)**

```json
{
  "token": "jwt...",
  "expiresIn": 1800,
  "userId": "USR-XXXX",
  "role": "ANALYST"
}
```

### `POST /api/auth/register`

**Request**

```json
{
  "email": "user@mail.com",
  "password": "string",
  "name": "string",
  "lastName": "string",
  "phoneNumber": "string"
}
```

**Response esperada**

- `201 Created` sin body en caso exitoso.

---

## 3.2 Projects

Base: `/api/projects`

- `POST /api/projects` -> crea proyecto (`ProjectRequest` -> `ProjectResponse`)
- `GET /api/projects/{id}` -> obtiene proyecto
- `GET /api/projects/user/{ownerId}` -> lista proyectos por usuario
- `PUT /api/projects/{id}` -> actualiza proyecto
- `DELETE /api/projects/{id}` -> elimina proyecto (`204`)

**`ProjectRequest`**

```json
{
  "name": "string",
  "description": "string",
  "ownerId": "USR-XXXX",
  "status": "ACTIVE"
}
```

**`ProjectResponse`**

```json
{
  "id": "PRJ-XXXX",
  "name": "string",
  "description": "string",
  "ownerId": "USR-XXXX",
  "status": "ACTIVE",
  "createdAt": "2026-04-17T10:00:00",
  "updatedAt": "2026-04-17T10:10:00"
}
```

---

## 3.3 Requirements

Base: `/requirements` (**nota:** no usa prefijo `/api`).

- `POST /requirements/convert` -> convierte texto a `RequirementDTO`
- `POST /requirements/save` -> guarda requisito
- `GET /requirements/search?query=...` -> busqueda semantica (`SearchResponse[]`)
- `POST /requirements/check-duplicates` -> `ApiResponse<DuplicateMatchResponse[]>`
- `GET /requirements/{id}/impact` -> impacto en grafo
- `POST /requirements/dependency?fromId=...&toId=...`
- `GET /requirements/{id}/conflicts`

**`ConvertRequest`**

```json
{
  "text": "texto libre del requisito",
  "projectId": "PRJ-XXXX"
}
```

**`RequirementDTO` (resumen)**

```json
{
  "id": "uuid",
  "code": "REQ-001",
  "title": "string",
  "description": "string",
  "actors": ["Usuario"],
  "acceptanceCriteria": ["criterio"],
  "isoClassification": "string",
  "projectId": "PRJ-XXXX",
  "relatedCodes": ["REQ-002"]
}
```

---

## 3.4 Graph y reglas de validacion

### Graph (`/api/graph`)

- `GET /api/graph/impact/{id}` -> `ApiResponse<ImpactResponse>`
- `POST /api/graph/infer-relations/{projectId}` -> `ApiResponse<RelationInferenceResponse>`

### Validation rules (`/api/validation-rules`)

- `GET /api/validation-rules/project/{projectId}`
- `POST /api/validation-rules`
- `PUT /api/validation-rules/{id}`
- `DELETE /api/validation-rules/{id}`

## 3.5 Matriz de consumo por modulo

| **Modulo** | **Metodo** | **Ruta** | **Cuerpo / Parametros** | **Respuesta** | **Componente Frontend que lo consume** | **Requiere JWT** |
| --- | --- | --- | --- | --- | --- | --- |
| **Autenticacion** | `POST` | `/api/auth/login` | `{ email, password }` | `{ token, expiresIn, userId, role }` | LoginPage | Si |
|  | `POST` | `/api/auth/register` | `{ email, password, name, lastName, phoneNumber }` | `201 sin body / 400 si email existe` | RegisterPage | No |
| **Proyectos** | `POST` | `/api/projects` | `{ name, description, ownerId, status }` | `{ projectId, name, status }` | CreateProjectModal, ProjectDashboard | Si |
|  | `GET` | `/api/projects/{id}` | — | `{ projectDetails }` | ProjectDetailPage | Si |
|  | `GET` | `/api/projects/user/{ownerId}` | — | `{ projectsList }` | UserProjectsPage | Si |
|  | `PUT` | `/api/projects/{id}` | `{ name, description, status }` | `{ updatedProject }` | EditProjectForm | Si |
|  | `DELETE` | `/api/projects/{id}` | — | `204 No Content` | DeleteProjectAction | Si |
| **Requisitos** | `POST` | `/api/requirements/convert` | `{ text, projectId }` | `{ requirementDTO }` | RequirementAssistant, RequirementList | Si |
|  | `POST` | `/api/requirements/save` | `{ RequirementDTO }` | `{ savedRequirement }` | SaveRequirementAction | Si |
|  | `GET` | `/api/requirements/project/{projectId}` | — | `{ requirementsList }` | ProjectRequirementsList | Si |
|  | `GET` | `/api/requirements/search` | `?query=...` | `{ searchResults }` | SearchResultsPage | Si |
|  | `POST` | `/api/requirements/check-duplicates` | `{ projectId, title, description }` | `{ duplicatesList }` | DuplicateCheckModal | Si |
|  | `GET` | `/api/requirements/{id}/impact` | — | `{ impactDetails }` | RequirementImpact | Si |
|  | `POST` | `/api/requirements/dependency` | `?fromId=...&toId=...` | `200 vacio` | CreateDependencyButton | Si |
|  | `GET` | `/api/requirements/{id}/conflicts` | — | `{ conflicts }` | RequirementConflicts | Si |
| **Grafo / Relaciones** | `GET` | `/api/graph/impact/{id}` | — | `{ impactGraphData }` | GraphVisualization | Si |
|  | `POST` | `/api/graph/infer-relations/{projectId}` | — | `{ relationsInferred }` | RelationInferenceButton | Si |
| **Diagramas (Clases)** | `POST` | `/api/diagrams/manual` | `{ projectId, name, sourceJson, plantUmlCode }` | `{ diagramResponse }` | ManualDiagramEditor | Si |
|  | `POST` | `/api/diagrams/class/auto/{projectId}` | — | `{ autoGeneratedDiagram }` | AutoClassDiagramGenerator | Si |
|  | `POST` | `/api/diagrams/{diagramId}/plantuml` | `{ plantUmlCode }` | `{ updatedPlantUmlCode }` | UpdateDiagramAction | Si |
|  | `GET` | `/api/diagrams/{diagramId}/export/puml` | — | `{ pumlFileContent }` | DownloadPumlButton | Si |
|  | `GET` | `/api/diagrams/{diagramId}/export/txt` | — | `{ txtFileContent }` | DownloadTxtButton | Si |
| **Diagramas (Casos de Uso)** | `POST` | `/api/diagrams/use-case/manual` | `{ projectId, name, sourceJson, plantUmlCode }` | `{ useCaseDiagramResponse }` | ManualUseCaseDiagramEditor | Si |
|  | `POST` | `/api/diagrams/use-case/auto/{projectId}` | — | `{ autoGeneratedUseCaseDiagram }` | AutoUseCaseDiagramGenerator | Si |
| **Reglas de Validacion** | `GET` | `/api/validation-rules/project/{projectId}` | — | `{ validationRulesList }` | ValidationRulesPage | Si |
|  | `POST` | `/api/validation-rules` | `{ ValidationRuleRequest }` | `{ createdValidationRule }` | CreateValidationRuleForm | Si |
|  | `PUT` | `/api/validation-rules/{id}` | `{ ValidationRuleRequest }` | `{ updatedValidationRule }` | EditValidationRuleForm | Si |
|  | `DELETE` | `/api/validation-rules/{id}` | — | `204 No Content` | DeleteValidationRuleButton | Si |

---

## 4) Tipos TypeScript recomendados

```ts
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type RoleType = "ADMIN" | "ANALYST" | "VIEWER";
export type StatusType = "ACTIVE" | "ARCHIVED" | "DRAFT";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  lastName: string;
  phoneNumber: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
  userId: string;
  role: RoleType;
}
```

---

## 5) Axios + JWT (contrato tecnico)

## 5.1 Rutas centralizadas

```ts
export const endpoints = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
  },
  projects: {
    base: "/api/projects",
    byId: (id: string) => `/api/projects/${id}`,
    byUser: (ownerId: string) => `/api/projects/user/${ownerId}`,
  },
  requirements: {
    base: "/requirements",
    convert: "/requirements/convert",
    save: "/requirements/save",
    search: "/requirements/search",
    duplicates: "/requirements/check-duplicates",
    impact: (id: string) => `/requirements/${id}/impact`,
    dependency: "/requirements/dependency",
    conflicts: (id: string) => `/requirements/${id}/conflicts`,
  },
};
```

## 5.2 Cliente Axios unico

```ts
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("session_user");
    }
    return Promise.reject(error);
  }
);
```

---

## 6) Flujo JWT esperado

1. Usuario hace login (`/api/auth/login`).
2. Front recibe `token`, `expiresIn`, `userId`, `role`.
3. Front guarda token (recomendado: `sessionStorage` o memoria).
4. Interceptor agrega `Authorization` en cada request protegido.
5. Si backend responde 401, se limpia sesion y se redirige a login.

---

## 7) Criterios de aceptacion de esta fase

- Todas las llamadas HTTP pasan por `apiClient`.
- No hay endpoints hardcodeados fuera de `endpoints`.
- No se usa `any` para contratos principales (`auth`, `projects`, `requirements`).
- El login deja lista la sesion JWT para consumir endpoints protegidos.
- Un 401 limpia sesion de forma consistente.

---

## 8) Nota operativa local

Con el `docker-compose.yml` actual, ya se contemplan:

- PostgreSQL + `pgvector`
- Neo4j

Esto permite probar localmente los casos de persistencia y grafo si el backend esta corriendo con sus variables de entorno.



================= Plan de acción  Miercoles 29 de Abril =================
Refactoriza los componentes grandes (como DiagramEditorPage) en componentes más pequeños y específicos.
Implementa un mejor manejo de carga y errores con estados centralizados (useContext o custom hooks).
Usa las facades para abstraer las operaciones de API.
Mejora la forma de mostrar los datos (evita JSON crudo).
Establece una convención consistente para las rutas API.
Escribe pruebas unitarias para componentes y servicios


