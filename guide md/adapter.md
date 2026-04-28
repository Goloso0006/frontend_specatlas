# Adapter Pattern en el Frontend de SpecAtlas

## Objetivo
El patrón Adapter se usa para convertir las respuestas del backend al formato que necesita el frontend.

En SpecAtlas esto es importante porque el backend devuelve distintos tipos de respuesta:
- `ApiResponse<T>`
- DTOs simples como `RequirementDTO`
- DTOs complejos como `DiagramSourceDTO` y `UseCaseDiagramSourceDTO`
- respuestas en texto como PlantUML
- respuestas binarias para exportación (`ResponseEntity<byte[]>`)

## Por qué es necesario
El frontend no debe depender directamente de la estructura exacta de los DTOs del backend.
Si la API cambia, solo se actualiza el adapter, no toda la app.

## Backend relacionado
Archivos importantes:
- `src/main/java/com/specatlas/backend/infrastructure/controller/AuthController.java`
- `src/main/java/com/specatlas/backend/infrastructure/controller/RequirementController.java`
- `src/main/java/com/specatlas/backend/infrastructure/controller/DiagramManagementController.java`
- `src/main/java/com/specatlas/backend/infrastructure/controller/GraphController.java`
- `src/main/java/com/specatlas/backend/application/service/ia/GeminiAdapter.java`

Endpoints relevantes:
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /requirements/convert`
- `POST /requirements/save`
- `GET /requirements/project/{projectId}`
- `POST /api/diagrams/manual`
- `POST /api/diagrams/class/auto/{projectId}`
- `POST /api/diagrams/use-case/auto/{projectId}`
- `POST /api/graph/infer-relations/{projectId}`

## Dónde usarlo
Crea adapters por dominio:
- autenticación
- requisitos
- diagramas
- grafo

## Estructura sugerida
```text
src/
  adapters/
    auth.adapter.ts
    requirement.adapter.ts
    diagram.adapter.ts
    graph.adapter.ts

Ejemplo de adapter

export function mapLoginResponse(dto: any) {
  return {
    token: dto.token,
    userId: dto.userId,
    role: dto.role,
    expiresIn: dto.expiresIn,
  };
}

export function mapRequirement(dto: any) {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    type: dto.requirementType,
    projectId: dto.projectId,
  };
}


Recomendaciones
No uses directamente los DTOs del backend en los componentes.
Si el backend responde con ApiResponse<T>, desempaqueta antes de mapear.
Normaliza nombres: por ejemplo requirementType → type.
Maneja null y undefined sin romper la UI.
Crea un adapter por módulo, no uno gigante.
Caso ideal en SpecAtlas
Cuando consumas:
POST /api/diagrams/class/auto/{projectId}
POST /api/diagrams/use-case/auto/{projectId}
convierte la respuesta a un modelo único del editor, por ejemplo:


type DiagramModel = {
  id: string;
  type: 'CLASS' | 'USE_CASE';
  nodes: NodeModel[];
  edges: EdgeModel[];
};


Beneficio final
El Adapter desacopla el frontend del backend y hace que tu UI sea más estable y fácil de mantener.