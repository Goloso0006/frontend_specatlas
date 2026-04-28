---

# 2) `README-Facade.md`

```md
# Facade Pattern en el Frontend de SpecAtlas

## Objetivo
El patrón Facade sirve para simplificar procesos complejos detrás de una sola función de alto nivel.

En SpecAtlas hay flujos que involucran varias llamadas al backend:
- crear requisito desde texto
- validar duplicados
- guardar requisito
- generar diagrama
- exportar diagrama
- inferir relaciones

El frontend no debería conocer todos esos pasos.

## Por qué usarlo
La Facade hace que el componente de UI llame una sola operación, por ejemplo:

```ts
await requirementFacade.createRequirementFromText(...)


Backend relacionado
Archivos importantes:
src/main/java/com/specatlas/backend/infrastructure/controller/RequirementController.java
src/main/java/com/specatlas/backend/infrastructure/controller/DiagramManagementController.java
src/main/java/com/specatlas/backend/infrastructure/controller/GraphController.java
src/main/java/com/specatlas/backend/application/service/RequirementService.java
src/main/java/com/specatlas/backend/application/service/DiagramManagementService.java
src/main/java/com/specatlas/backend/application/service/ia/GeminiAdapter.java
Flujos útiles:
POST /requirements/convert
POST /requirements/check-duplicates
POST /requirements/save
POST /api/diagrams/manual
POST /api/diagrams/class/auto/{projectId}
POST /api/graph/infer-relations/{projectId}
Dónde usarlo
Crea facades para:
auth
requirements
diagrams
graph
Estructura sugerida

src/
  facades/
    auth.facade.ts
    requirement.facade.ts
    diagram.facade.ts
    graph.facade.ts


Ejemplo de Facade

export class RequirementFacade {
  constructor(private api: any, private adapter: any) {}

  async createRequirementFromText(projectId: string, text: string) {
    const converted = await this.api.convertRequirement({ projectId, text });

    const duplicates = await this.api.checkDuplicates({
      projectId,
      title: converted.title,
      description: converted.description,
    });

    if (duplicates.length > 0) {
      return {
        status: 'warning',
        duplicates,
      };
    }

    const saved = await this.api.saveRequirement(converted);
    return {
      status: 'success',
      data: this.adapter.mapRequirement(saved),
    };
  }
}


Recomendaciones
No pongas lógica de negocio en los componentes.
La Facade debe coordinar llamadas, no renderizar UI.
Usa adapters dentro de la facade.
Devuelve errores consistentes.
Mantén una facade por dominio.
Caso ideal en SpecAtlas
El botón “Generar diagrama automático” debería llamar solo a:
await diagramFacade.generateClassDiagram(projectId)
Y la facade internamente:
llama al backend
adapta la respuesta
actualiza el store del editor
Beneficio final

La Facade simplifica el frontend y evita repetir flujos complejos en muchos componentes.