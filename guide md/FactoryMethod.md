---

# 3) `README-FactoryMethod.md`

```md
# Factory Method en el Frontend de SpecAtlas

## Objetivo
El patrón Factory Method sirve para crear objetos según un tipo de entrada, evitando `if/else` o `switch` grandes en muchos lugares.

En el editor de diagramas de SpecAtlas esto es muy útil, porque habrá varios tipos de elementos:
- nodos
- relaciones
- actores
- casos de uso
- clases
- interfaces
- métodos
- atributos

## Por qué usarlo
Cuando el editor crezca, una factory centralizada te permite crear todo desde un solo punto.

## Backend relacionado
Archivos importantes:
- `src/main/java/com/specatlas/backend/infrastructure/controller/DiagramManagementController.java`
- `src/main/java/com/specatlas/backend/infrastructure/controller/GraphController.java`
- `src/main/java/com/specatlas/backend/application/service/ia/GeminiAdapter.java`

Respuestas que pueden alimentar la factory:
- `DiagramSourceDTO`
- `UseCaseDiagramSourceDTO`
- `RelationInferenceResponse`

## Dónde usarlo
Principalmente en:
- creación de nodos del editor
- creación de relaciones
- conversión de JSON del backend a elementos visuales

## Estructura sugerida
```text
src/
  factories/
    diagramElement.factory.ts
    diagramNode.factory.ts
    diagramRelation.factory.ts


Ejemplo

export class DiagramElementFactory {
  static createNode(type: string, data: any) {
    switch (type) {
      case 'CLASS':
        return { kind: 'classNode', ...data };
      case 'INTERFACE':
        return { kind: 'interfaceNode', ...data };
      case 'USE_CASE':
        return { kind: 'useCaseNode', ...data };
      case 'ACTOR':
        return { kind: 'actorNode', ...data };
      default:
        throw new Error(`Tipo de nodo no soportado: ${type}`);
    }
  }

  static createRelation(type: string, data: any) {
    switch (type) {
      case 'DEPENDENCY':
        return { kind: 'dependencyRelation', ...data };
      case 'ASSOCIATION':
        return { kind: 'associationRelation', ...data };
      default:
        throw new Error(`Tipo de relación no soportado: ${type}`);
    }
  }
}


Recomendaciones
No crees nodos manualmente en cada componente.
Usa tipos TypeScript para evitar errores.
Si aparece un nuevo tipo de diagrama, actualiza solo la factory.
Separa factory por responsabilidad si el editor crece.
Mantén la factory independiente de la UI.
Caso ideal en SpecAtlas
Si el backend devuelve un diagrama JSON, la factory transforma esos datos en elementos del editor.
Beneficio final


La Factory Method evita duplicación y hace el editor más escalable.