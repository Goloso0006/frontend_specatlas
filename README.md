# SpecAtlas — Frontend

Frontend de SpecAtlas: SPA en React + Vite para edición, visualización y exportación de requisitos y diagramas.

Este README ampliado explica con mayor profundidad el propósito del proyecto, el flujo de datos, las estructuras que maneja y los patrones de diseño aplicados. El contenido se basa en las guías internas (`guide md/`) y en la revisión del código del repositorio.

## Propósito funcional
- Visualización interactiva de requisitos como nodos en un grafo con relaciones de dependencia, conflicto e impacto.
- Editor de diagramas (clase y casos de uso) con serialización a JSON y persistencia.
- Generación de reportes en HTML que se pueden exportar a Google Docs, PDF o Word a través del backend.

## Flujo de datos (alto nivel)
1. Componentes/páginas solicitan datos mediante servicios en `src/api/`.
2. Respuestas del backend (DTOs) se adaptan a modelos de UI mediante `src/adapters/`.
3. Las `facades` (`src/facades/`) orquestan llamadas y devuelven operaciones de alto nivel a las `pages`.
4. Los mapeadores en `src/utils/` transforman diagram JSON ↔ nodos/edges del editor y aplican reglas de normalización y deduplicación.
5. Layout y posicionamiento se calculan con utilidades en `src/utils/diagramLayoutUtils.ts` y `generatedDiagramMapper.ts`.
6. Exportes: `src/pages/ProjectReportsPage.tsx` prepara HTML y llama a `src/api/services/exportApi.ts`.

## Patrones de diseño aplicados (con implementación verificada)

- Adapter
  - Implementación: `src/adapters/` (ej. `src/adapters/requirements.adapter.ts`).
  - Papel: transforma DTOs del backend a modelos seguros para la UI (normalización, saneamiento, campos opcionales).

- Facade
  - Implementación: `src/facades/` (ej. `src/facades/requirement.facade.ts`).
  - Papel: expone operaciones compuestas (convertir texto → validar duplicados → guardar), orquesta llamadas a lower-level APIs y usa adapters internamente.

- Factory Method
  - Implementación: `src/factories/diagramElement.factory.ts`.
  - Papel: crea nodos y relaciones del diagrama según tipos (class, use-case, relation), centralizando la lógica de construcción.

- Proxy / HTTP Interceptor
  - Implementación: `src/api/interceptors.ts` y cliente en `src/api/client.ts`.
  - Papel: añade `Authorization`, maneja `401`, y centraliza comportamiento común en peticiones HTTP.

- State Machine / Controller
  - Implementación: `src/state/` y hooks como `src/hooks/useDiagramEditorController.ts`.
  - Papel: controla estados del editor (loading, editing, saving, exporting, error) y expone APIs de interacción al UI.

- Mapper / Utility Layer (Diagram mapping & layout)
  - Implementación: `src/utils/diagramMapper.ts`, `src/utils/generatedDiagramMapper.ts`, `src/utils/diagramLayoutUtils.ts`.
  - Papel: parseo robusto de diferentes formatos de diagrama, normalización de edges/nodes, deduplicación, validación y cálculo de posiciones.

### Expansión detallada por patrón

A continuación se describe cada patrón con mayor profundidad: su propósito genérico, el rol concreto que cumple en SpecAtlas, y las rutas de los archivos donde se encuentra la implementación.

- Adapter
  - Nombre: Adapter (Adaptador)
  - Propósito general: adaptar una interfaz incompatible a la que el cliente espera, transformando datos y ocultando variaciones de formato.
  - Rol en SpecAtlas: el backend devuelve DTOs con distintos nombres y estructuras; los adapters garantizan que los componentes reciban objetos limpios y consistentes (por ejemplo, normalizar `requirementType`, limpiar `null/undefined`, unificar `sourceJson` vs `content`).
  - Función en el sistema: centralizar saneamiento, evitar lógica de parsing en componentes y reducir el impacto de cambios en la API.
  - Implementación y ejemplos:
    - `src/adapters/requirements.adapter.ts` — funciones como `adaptRequirementDTO`, `adaptRequirementDTOList`, `adaptTraceabilityLink`.
    - Uso: `requirement.facade` y componentes llaman al facade/api y reciben objetos ya adaptados.

- Facade
  - Nombre: Facade (Fachada)
  - Propósito general: proporcionar una interfaz simplificada para subsistemas complejos; ocultar múltiples llamadas/steps detrás de un método único.
  - Rol en SpecAtlas: consolida flujos como "convertir texto → chequear duplicados → guardar" o "generar diagrama automático → adaptar respuesta → actualizar estado", entregando una API estable a las páginas.
  - Función en el sistema: evitar repetición de pasos de negocio en componentes, centralizar validaciones y transformar respuestas antes de exponerlas.
  - Implementación y ejemplos:
    - `src/facades/requirement.facade.ts` — métodos como `createRequirementFromText`, `saveRequirement`, `getGraphImpact`.
    - `src/facades/diagram.facade.ts` — orquesta llamadas a `diagramsApi`, aplica adaptaciones y llama a `diagramMapper`.

- Factory Method
  - Nombre: Factory Method
  - Propósito general: delegar la creación de objetos complejos a una fábrica que encapsula la lógica de instanciación según tipo.
  - Rol en SpecAtlas: crear nodos y aristas del editor con propiedades por defecto (id seguro, posición, datos derivados de requisitos), evitando condicionales dispersos.
  - Función en el sistema: homogeneizar creación de elementos, facilitar extensibilidad para nuevos tipos de nodo/relación.
  - Implementación y ejemplos:
    - `src/factories/diagramElement.factory.ts` — `createNode`, `createRelation` delegan a helpers de `diagramMapper`.

- Proxy / HTTP Interceptor
  - Nombre: Proxy (cliente HTTP centralizado) / Interceptor
  - Propósito general: encapsular acceso a recursos remotos, añadir políticas transversales (auth, retries, logging).
  - Rol en SpecAtlas: garantiza que todas las llamadas lleven JWT, gestiona expiración y redirección a login en 401.
  - Función en el sistema: simplificar services y evitar replicar handling de auth en múltiples archivos.
  - Implementación y ejemplos:
    - `src/api/client.ts` — instancia del cliente Axios.
    - `src/api/interceptors.ts` — `withAuthHeader`, `handleUnauthorized`.

- State Machine / Controller
  - Nombre: State Machine / Controller Hook
  - Propósito general: modelar estados finitos para controlar transiciones y comportamientos UI dependientes de estado.
  - Rol en SpecAtlas: controla ciclos del editor (carga, edición, guardado, exportación), snapshots de history, y lógica de autosave en `unmount`.
  - Función en el sistema: evitar estados inconsistentes y centralizar la lógica de transiciones.
  - Implementación y ejemplos:
    - `src/state/diagramEditor.store.ts` / `diagramEditor.machine.ts` (si existe máquina formal) y `src/hooks/useDiagramEditorController.ts` (orquestador del editor).

- Mapper / Utility Layer (Diagram mapping & layout)
  - Nombre: Mapper / Utilities
  - Propósito general: funciones puras de transformación y algoritmos (parsing robusto, deduplicación, layout automático).
  - Rol en SpecAtlas: interpretar JSON variado (AI/backend), producir nodos/edges válidos y calcular posiciones que el lienzo usa para render.
  - Función en el sistema: evitar parsing frágil en componentes y mantener reglas de negocio de diagramas en un único lugar.
  - Implementación y ejemplos:
    - `src/utils/diagramMapper.ts` — `parseDiagramSource`, `normalizeEdge`, `diagramSourceToReactFlow`.
    - `src/utils/generatedDiagramMapper.ts` — mapea canvas generados por IA a posiciones de export.
    - `src/utils/diagramLayoutUtils.ts` — `autoLayoutDiagram` y utilidades de spacing.

## Estructuras de datos (más detalle y ejemplos)

- `RequirementDTO` (ubicación: `src/types/requirements.ts`, adaptaciones en `src/adapters/requirements.adapter.ts`)
  - Campos clave y significado:
    - `id`: identificador interno (string)
    - `code`: código legible del requisito (p.ej. `RF-001`, `RNF-002`)
    - `title`: título corto
    - `description`: descripción larga
    - `requirementType`: `FUNCTIONAL` | `NON_FUNCTIONAL` (usa `RNF`/`RF` en UI cuando procede)
    - `derivedFrom`: referencias a elementos que originaron el requisito

- `DiagramSource` / `DiagramNode` / `DiagramRelation` (ubicación: `src/types/diagrams.ts`, parser en `src/utils/diagramMapper.ts`)
  - Ejemplo de `DiagramNode`:
    - `id`: string (unique)
    - `kind`: 'class' | 'actor' | 'useCase' | 'package'
    - `position`: { x: number, y: number }
    - `derivedFromRequirements`: string[] (códigos)
  - Ejemplo de `DiagramRelation`:
    - `id`, `source`, `target`, `type` (p.ej. 'umlEdge'), `data`: { relationshipType, label }

- `ImpactGraphResponse` / `RelationInferenceResponse` (ubicación: `src/types/graph.ts`, usado en `requirement.facade` y `RequirementGraphFlow`)
  - Describe nodos + aristas inferidas por servicios de análisis (puede incluir pesos, razones, evidencias).

## Comprobaciones hechas en el repositorio
- Se verificó la presencia de implementaciones para cada patrón listado: `src/adapters/*`, `src/facades/*`, `src/factories/*`, `src/api/interceptors.ts`, `src/hooks/useDiagramEditorController.ts`, `src/utils/diagramMapper.ts`, `src/components/graph/RequirementGraphFlow.tsx`.
- Se verificó que los adapters realizan normalización (ej.: `adaptRequirementDTO`), las facades orquestan flujos (ej.: `createRequirementFromText`) y la factory delega a `diagramMapper`.

## Uso práctico (cómo encontrar código relevante)
- Para entender cómo se adapta un `RequirementDTO`: abrir `src/adapters/requirements.adapter.ts`.
- Para ver el flujo "convertir texto → crear requisito": `src/facades/requirement.facade.ts`.
- Para ver creación de nodos y relaciones: `src/factories/diagramElement.factory.ts` y `src/utils/diagramMapper.ts`.
- Para revisar la lógica de layout usada en export/reporte: `src/utils/generatedDiagramMapper.ts` y `src/utils/diagramLayoutUtils.ts`.

## Próximos pasos sugeridos (si deseas que continúe)
- Puedo insertar pequeñas referencias de línea/función en el README apuntando a ejemplos concretos si quieres que sea aún más navegable.
- Puedo generar un `docs/PATTERNS.md` con extractos de código si prefieres documentación separada.

## Estructuras de datos (detalladas y ubicación)

- RequirementDTO / Requirement
  - Campos relevantes: `id`, `code`, `title`, `description`, `requirementType` (`FUNCTIONAL` | `NON_FUNCTIONAL`), `projectId`.
  - Zona de adaptación: `src/adapters/requirements.adapter.ts` (normaliza y sanea campos antes de exponerlos a la UI).

- DiagramSource / DiagramNode / DiagramRelation
  - `DiagramSource`: objeto raíz con `diagramType`, `nodes[]` y `edges[]`.
  - `DiagramNode`: identificador, `kind` (`class`, `actor`, `useCase`, `package`), `position`, `derivedFromRequirements`.
  - `DiagramRelation`: `id`, `source`, `target`, `type` y `data` con `relationshipType`, multiplicidades y etiqueta.
  - Parser / serializer y utilidades: `src/utils/diagramMapper.ts` (funciones como `parseDiagramSource`, `diagramSourceToReactFlow`, `serializeDiagramSource`).

- Canonical relation types
  - La UI trabaja con tipos canónicos (`DEPENDS_ON`, `CONFLICTS_WITH`, `IMPACTS`, `RELATES_TO`, etc.) y mantiene la traza original en `edges.data.originalType`.
  - Normalización y extracción de relaciones: `src/components/graph/RequirementGraphFlow.tsx` y `src/utils/diagramMapper.ts`.

## Dónde están los puntos clave del código
- Cliente HTTP e interceptores: `src/api/client.ts`, `src/api/interceptors.ts`.
- Lógica de exportación: `src/api/services/exportApi.ts`, `src/pages/ProjectReportsPage.tsx`.
- Adaptadores de dominio: `src/adapters/requirements.adapter.ts`.
- Fachadas: `src/facades/requirement.facade.ts`, `src/facades/diagram.facade.ts`.
- Factory: `src/factories/diagramElement.factory.ts`.
- Hooks / controladores: `src/hooks/useDiagramEditorController.ts`.
- Componentes de grafo: `src/components/graph/RequirementGraphFlow.tsx` (normalización, layout y render).
- Mapeadores y layouts: `src/utils/diagramMapper.ts`, `src/utils/generatedDiagramMapper.ts`, `src/utils/diagramLayoutUtils.ts`.

## Comportamiento observado durante la revisión del código
- Los adapters (`src/adapters/requirements.adapter.ts`) realizan saneamiento y transformación de DTOs a estructuras seguras para la UI.
- `RequirementFacade` centraliza flujos como `createRequirementFromText` y encapsula validaciones y orquestación de llamadas.
- `DiagramElementFactory` delega en `diagramMapper` para crear nodos y relaciones base.
- `withAuthHeader` y `handleUnauthorized` (en `src/api/interceptors.ts`) gestionan el JWT y la expiración de la sesión.
- `useDiagramEditorController` (hook) implementa el controlador/estado del editor, history snapshots y autosave en `unmount`.

## Comandos de desarrollo
```bash
npm install
npm run dev
```

## Archivos de referencia rápida
- `src/pages/ProjectReportsPage.tsx`
- `src/components/graph/RequirementGraphFlow.tsx`
- `src/utils/diagramMapper.ts`
- `src/utils/diagramLayoutUtils.ts`

