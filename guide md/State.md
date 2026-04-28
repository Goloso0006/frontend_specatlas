---

# 4) `README-State.md`

```md
# State Pattern en el Frontend de SpecAtlas

## Objetivo
El patrón State ayuda a modelar estados claros para interfaces interactivas.

En SpecAtlas, el editor de diagramas y varios flujos tienen estados bien definidos:
- `idle`
- `loading`
- `editing`
- `saving`
- `exporting`
- `error`

## Por qué usarlo
Porque la UI se vuelve más estable cuando su comportamiento depende del estado actual.

## Backend relacionado
Archivos importantes:
- `src/main/java/com/specatlas/backend/infrastructure/controller/DiagramManagementController.java`
- `src/main/java/com/specatlas/backend/infrastructure/controller/DiagramController.java`
- `src/main/java/com/specatlas/backend/infrastructure/controller/RequirementController.java`

Operaciones que cambian el estado:
- `POST /api/diagrams/manual`
- `POST /api/diagrams/class/auto/{projectId}`
- `POST /api/diagrams/use-case/auto/{projectId}`
- `POST /api/diagrams/{diagramId}/plantuml`
- `GET /api/diagrams/{diagramId}/export/puml`
- `GET /api/diagrams/{diagramId}/export/txt`

## Dónde usarlo
Especialmente en:
- editor de diagramas
- guardado
- carga de información
- exportación
- manejo de errores

## Estructura sugerida
```text
src/
  state/
    diagramEditor.store.ts
    diagramEditor.machine.ts


Ejemplo conceptual

type DiagramEditorState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'editing'; diagramId: string }
  | { status: 'saving' }
  | { status: 'exporting' }
  | { status: 'error'; message: string };


Recomendaciones
Evita manejar demasiados booleanos sueltos.
Usa un estado único con variantes.
No permitas estados imposibles.
Si el flujo es complejo, usa una máquina de estados.
Mantén la lógica del estado separada de los componentes.
Caso ideal en SpecAtlas
Cuando el usuario abre un diagrama:
pasa a loading
si la carga termina bien → editing
si guarda → saving
si exporta → exporting
si falla → error
Beneficio final
El State Pattern te ayuda a controlar mejor el editor y a evitar bugs de UI.
