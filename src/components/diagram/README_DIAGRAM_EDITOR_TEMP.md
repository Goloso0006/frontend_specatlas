# Plan Temporal — Editor de Diagramas de Clases en SpecAtlas

Este documento define los pasos y criterios para construir correctamente el editor visual de diagramas de clases dentro de SpecAtlas.  
La finalidad es que el desarrollo se haga por fases, sin romper el backend, las rutas actuales ni la lógica existente de diagramas.

---

## 1. Objetivo general

Construir un editor visual de diagramas de clases que permita al usuario:

- Crear clases manualmente.
- Editar nombre, atributos y métodos.
- Crear relaciones UML entre clases.
- Mover clases dentro de un canvas visual.
- Guardar el diagrama con sus nodos, relaciones y posiciones.
- Generar clases o diagramas completos con IA.
- Exportar el diagrama a PlantUML.
- Mantener compatibilidad con las normas/reglas del proyecto.

El editor debe sentirse como una herramienta visual profesional, no como un formulario simple.

---

## 2. Flujo esperado del usuario

El flujo correcto debe ser:

```txt
Proyecto
→ Diagramas
→ Selección / biblioteca de diagramas
→ Crear o abrir diagrama de clases
→ Editor visual

La pantalla de diagramas no debe abrir directamente el canvas vacío.

Primero debe existir una pantalla donde el usuario pueda:

→ Ver diagramas existentes.
→ Crear un nuevo diagrama.
→ Seleccionar el tipo de diagrama.
→ Abrir un diagrama guardado.
→ Generar un diagrama con IA si aplica.

---
## 3. Pantalla inicial de diagramas

La ruta sugerida:

/projects/:projectId/diagrams

debe mostrar una pantalla inicial con:

Título: Diagramas del proyecto.
Descripción: Crea, genera y administra los diagramas asociados a este proyecto.
Tarjetas para tipos de diagramas:
Diagrama de clases.
Diagrama de casos de uso.
Diagrama de componentes.
Diagrama de secuencia.
Sección de diagramas guardados.
Botón para crear nuevo diagrama.
Botón para generar con IA si aplica.

Solo al seleccionar un diagrama o crear uno nuevo debe abrirse el editor visual.

## 4. Ruta del editor visual
Ruta sugerida para abrir un diagrama existente:

/projects/:projectId/diagrams/:diagramId

Ruta sugerida para crear un nuevo diagrama:

/projects/:projectId/diagrams/new?type=CLASS

El editor debe recibir siempre un projectId real.

No se debe usar userId como projectId.

Validación obligatoria:

Si projectId está vacío o empieza por USR-, mostrar error y no llamar backend.

## 5. Estructura general del editor
El editor debe estar dividido en tres zonas principales:
┌──────────────────────────────────────────────────────────────┐
│                       Barra superior                       │
├───────────────┬───────────────────────────────┬──────────────┤
│ Herramientas  │ Canvas visual                 │ Propiedades  │
│               │                               │              │
│ + Clase       │ [Clase Usuario]               │ Clase        │
│ + Relación    │ [Clase Cliente]──[Clase Cita] │ Atributos    │
│ Generar IA    │                               │ Métodos      │
│ Guardar       │                               │ Relaciones   │
│ Exportar PUML │                               │              │
└───────────────┴───────────────────────────────┴──────────────┘

# Fases 
6. Fase 1 — Separar biblioteca de diagramas y editor
Objetivo

Evitar que el usuario entre directamente al canvas vacío al abrir la sección de diagramas.

Tareas
Crear una pantalla inicial de diagramas del proyecto.
Mostrar tipos de diagramas disponibles.
Mostrar diagramas guardados del proyecto.
Crear una ruta separada para el editor.
Navegar al editor solo cuando el usuario cree o abra un diagrama.
Criterios de aceptación
Al entrar a Diagramas, no se abre directamente el canvas.
Se muestra una pantalla de selección/biblioteca.
Los diagramas guardados aparecen como tarjetas.
El editor visual sigue existiendo, pero en una ruta específica.

7. Fase 2 — Editor manual básico
Objetivo

Permitir que el usuario cree y edite clases manualmente dentro del canvas.

Debe permitir
Agregar una clase al canvas.
Mostrar la clase como nodo visual.
Mover la clase libremente.
Seleccionar una clase.
Editar el nombre de la clase desde el panel de propiedades.
Eliminar una clase seleccionada.
Guardar el diagrama.
Clase inicial sugerida

Cuando el usuario presiona Agregar clase, se debe crear algo como:

NuevaClase

Con datos iniciales:

{
  "id": "class-uuid",
  "type": "class",
  "position": {
    "x": 100,
    "y": 100
  },
  "data": {
    "name": "NuevaClase",
    "attributes": [],
    "methods": []
  }
}
Criterios de aceptación
El usuario puede agregar clases.
Las clases aparecen en el canvas.
Las clases se pueden mover.
Las clases se pueden seleccionar.
El nombre de la clase se puede editar.
Las clases se pueden eliminar.

## 8. Fase 3 — Nodo visual de clase
Objetivo

Crear un nodo personalizado para representar clases UML de forma clara y profesional.

Ejemplo visual
┌─────────────────────────────┐
│ Usuario                     │
├─────────────────────────────┤
│ - id: UUID                  │
│ - nombre: String            │
│ - email: String             │
├─────────────────────────────┤
│ + iniciarSesion(): void     │
│ + cerrarSesion(): void      │
└─────────────────────────────┘

El nodo debe mostrar
Nombre de clase.
Lista de atributos.
Lista de métodos.

Si no hay atributos o métodos, mostrar texto sutil:

Sin atributos
Sin métodos
Criterios de aceptación
El nodo se ve como una clase UML.
Tiene división visual entre nombre, atributos y métodos.
No se ve como una tarjeta genérica.
Mantiene la estética premium de SpecAtlas.
---

## Fase adicional — Tipos de elementos UML

El editor de diagrama de clases no debe limitarse únicamente a clases normales.  
Debe permitir representar distintos tipos de elementos UML y estereotipos usados en arquitectura de software.

### Tipos principales soportados

| Tipo | Representación | Descripción |
|---|---|---|
| `CLASS` | `class Usuario` | Clase normal del sistema |
| `ABSTRACT_CLASS` | `abstract class Persona` | Clase base que no se instancia directamente |
| `INTERFACE` | `interface Autenticable` | Contrato que otras clases implementan |
| `ENUM` | `enum EstadoCita` | Lista cerrada de valores |
| `DTO` | `<<dto>> RegistroRequest` | Objeto de transferencia de datos |
| `ENTITY` | `<<entity>> Usuario` | Clase persistente del dominio |
| `SERVICE` | `<<service>> CitaService` | Clase de lógica de negocio |
| `REPOSITORY` | `<<repository>> UsuarioRepository` | Acceso a persistencia |
| `CONTROLLER` | `<<controller>> AuthController` | Entrada de API o controlador |
| `VALUE_OBJECT` | `<<value object>> Email` | Objeto de valor del dominio |
| `EXCEPTION` | `<<exception>> UsuarioNoEncontradoException` | Excepción personalizada |

---

### Comportamiento esperado

Al crear un nuevo elemento, el usuario debe poder elegir el tipo:

```txt
+ Agregar elemento
  ├── Clase
  ├── Clase abstracta
  ├── Interfaz
  ├── Enumeración
  ├── DTO
  ├── Entidad
  ├── Servicio
  ├── Repositorio
  └── Controlador

Cada tipo debe cambiar la forma en que se renderiza el nodo.

### Visualización sugerida por tipo
Clase normal
┌────────────────────────┐
│ Usuario                │
├────────────────────────┤
│ - id: UUID             │
│ - nombre: String       │
├────────────────────────┤
│ + iniciarSesion(): void│
└────────────────────────┘
Clase abstracta
┌────────────────────────┐
│ <<abstract>>           │
│ Persona                │
├────────────────────────┤
│ - id: UUID             │
│ - nombre: String       │
├────────────────────────┤
│ + validar(): boolean   │
└────────────────────────┘

También puede mostrarse el nombre en cursiva si el diseño lo permite.

Interfaz
┌────────────────────────┐
│ <<interface>>          │
│ Notificable            │
├────────────────────────┤
│ + enviar(): void       │
└────────────────────────┘

Las interfaces normalmente no necesitan atributos, aunque el editor puede permitir constantes si se requiere.

Enumeración
┌────────────────────────┐
│ <<enum>>               │
│ EstadoCita             │
├────────────────────────┤
│ PENDIENTE              │
│ CONFIRMADA             │
│ CANCELADA              │
│ COMPLETADA             │
└────────────────────────┘

Las enumeraciones deben permitir editar valores, no atributos/métodos tradicionales.

DTO
┌────────────────────────┐
│ <<dto>>                │
│ RegistroRequest        │
├────────────────────────┤
│ email: String          │
│ password: String       │
└────────────────────────┘
Entity
┌────────────────────────┐
│ <<entity>>             │
│ Cita                   │
├────────────────────────┤
│ - id: UUID             │
│ - fecha: LocalDateTime │
│ - estado: EstadoCita   │
└────────────────────────┘
Service
┌────────────────────────┐
│ <<service>>            │
│ CitaService            │
├────────────────────────┤
│ + crearCita(): Cita    │
│ + cancelarCita(): void │
└────────────────────────┘

Propiedades del elemento

Cuando se seleccione un nodo, el panel derecho debe permitir editar:

Tipo de elemento.
Nombre.
Estereotipo.
Atributos, si aplica.
Métodos, si aplica.
Valores, si es enum.
Notas o descripción opcional.

Ejemplo de estructura interna:

{
  "id": "class-usuario",
  "type": "classNode",
  "position": {
    "x": 100,
    "y": 120
  },
  "data": {
    "umlType": "CLASS",
    "stereotype": "entity",
    "name": "Usuario",
    "attributes": [
      {
        "visibility": "private",
        "name": "email",
        "type": "String",
        "required": true
      }
    ],
    "methods": [
      {
        "visibility": "public",
        "name": "iniciarSesion",
        "parameters": "password: String",
        "returnType": "boolean"
      }
    ],
    "enumValues": []
  }
}

Para una enumeración:

{
  "id": "enum-estado-cita",
  "type": "classNode",
  "position": {
    "x": 300,
    "y": 180
  },
  "data": {
    "umlType": "ENUM",
    "stereotype": "enum",
    "name": "EstadoCita",
    "attributes": [],
    "methods": [],
    "enumValues": [
      "PENDIENTE",
      "CONFIRMADA",
      "CANCELADA",
      "COMPLETADA"
    ]
  }
}
Relaciones asociadas a tipos UML

El editor debe soportar relaciones coherentes según el tipo de elemento:

Relación	Uso
INHERITANCE	Clase hija hereda de clase padre o abstracta
IMPLEMENTATION	Clase implementa una interfaz
ASSOCIATION	Clase se relaciona con otra
AGGREGATION	Relación todo-parte débil
COMPOSITION	Relación todo-parte fuerte
DEPENDENCY	Una clase usa temporalmente otra
REALIZATION	Similar a implementación de interfaz

Ejemplos:

Cliente --|> Usuario
Profesional --|> Usuario
EmailNotification ..|> Notificable
Cita *-- Pago
Cliente -- Cita : realiza
Exportación PlantUML por tipo

El exportador debe respetar el tipo UML.

Clase normal
class Usuario {
  - id: UUID
  - email: String
  + iniciarSesion(): boolean
}
Clase abstracta
abstract class Persona {
  - id: UUID
  - nombre: String
}
Interfaz
interface Notificable {
  + enviar(): void
}
Enumeración
enum EstadoCita {
  PENDIENTE
  CONFIRMADA
  CANCELADA
  COMPLETADA
}
Estereotipos
class Usuario <<entity>> {
  - id: UUID
  - email: String
}

class CitaService <<service>> {
  + crearCita(): Cita
}
Validaciones por tipo

Antes de guardar:

Todo elemento debe tener nombre.
No puede haber dos elementos con el mismo nombre.
Una enumeración debe tener al menos un valor.
Una interfaz debe tener al menos un método o estar marcada como incompleta.
Una clase abstracta puede tener métodos abstractos.
Una clase normal no debe tener nombre genérico como NuevaClase al guardar.
Los nombres deben estar en singular si las normas del proyecto lo exigen.
Las relaciones de implementación deben salir desde una clase hacia una interfaz.
Las relaciones de herencia deben conectar clases compatibles.
Criterios de aceptación

El soporte de tipos UML estará correcto cuando:

El usuario pueda crear una clase normal.
El usuario pueda crear una clase abstracta.
El usuario pueda crear una interfaz.
El usuario pueda crear una enumeración.
El usuario pueda crear elementos con estereotipos como entity, service, repository, controller o dto.
Cada tipo se renderice visualmente de forma diferenciada.
El panel derecho permita editar las propiedades según el tipo.
El exportador PlantUML respete el tipo seleccionado.
Las relaciones UML sean coherentes con los tipos.
El guardado conserve el tipo del elemento.
Al abrir el diagrama nuevamente, los tipos se mantengan.

---

## Cómo cambiaría el botón actual

En vez de solo:

```txt
Agregar clase

mejor:

Agregar elemento

Y al presionar:

Clase
Clase abstracta
Interfaz
Enumeración
DTO
Entidad
Servicio
Repositorio
Controlador

Así el editor queda mucho más completo.

Mi recomendación

Para no complicarlo demasiado al inicio, implementa en este orden:

1. CLASS
2. ABSTRACT_CLASS
3. INTERFACE
4. ENUM
5. Estereotipos: entity, service, repository, controller, dto

---
## 9. Fase 4 — Panel de propiedades de clase
Objetivo

Permitir editar toda la información de una clase seleccionada desde el panel de propiedades.

Panel esperado

Cuando el usuario selecciona una clase, el panel derecho debe mostrar:

Propiedades de clase

Nombre:
[ Usuario ]

Atributos:
+ Agregar atributo
- id : UUID
- nombre : String

Métodos:
+ Agregar método
+ iniciarSesion() : void
Atributos

Cada atributo debe permitir definir:

Visibilidad:
private
public
protected
Nombre.
Tipo.
Requerido opcionalmente.

Ejemplo:

{
  "visibility": "private",
  "name": "email",
  "type": "String",
  "required": true
}
Métodos

Cada método debe permitir definir:

Visibilidad.
Nombre.
Parámetros.
Tipo de retorno.

Ejemplo:

{
  "visibility": "public",
  "name": "crearCita",
  "parameters": "fecha: LocalDateTime",
  "returnType": "Cita"
}
Criterios de aceptación
El usuario puede agregar atributos.
El usuario puede editar atributos.
El usuario puede eliminar atributos.
El usuario puede agregar métodos.
El usuario puede editar métodos.
El usuario puede eliminar métodos.
El nodo visual se actualiza al editar.

---
## 10. Fase 5 — Relaciones UML
Objetivo

Permitir conectar clases y definir relaciones UML reales.

Tipos de relación permitidos
Tipo	Significado
ASSOCIATION	Asociación
AGGREGATION	Agregación
COMPOSITION	Composición
INHERITANCE	Herencia
IMPLEMENTATION	Implementación
DEPENDENCY	Dependencia
Propiedades de relación

Cuando se selecciona una relación, el panel derecho debe mostrar:

Propiedades de relación

Origen: Cliente
Destino: Cita
Tipo: Asociación
Etiqueta: realiza
Multiplicidad origen: 1
Multiplicidad destino: 0..*

Ejemplo JSON:

{
  "id": "edge-uuid",
  "source": "class-cliente",
  "target": "class-cita",
  "data": {
    "relationshipType": "ASSOCIATION",
    "label": "realiza",
    "sourceMultiplicity": "1",
    "targetMultiplicity": "0..*"
  }
}
Criterios de aceptación
El usuario puede conectar dos clases.
La relación aparece visualmente en el canvas.
El usuario puede seleccionar una relación.
El usuario puede editar el tipo de relación.
El usuario puede editar etiqueta.
El usuario puede editar multiplicidades.
El usuario puede eliminar relaciones.

---
## 11. Fase 6 — Canvas visual
Objetivo

Hacer que el canvas sea usable, claro y controlado.

El canvas debe permitir
Mover nodos.
Conectar clases.
Seleccionar nodos.
Seleccionar relaciones.
Eliminar seleccionado.
Hacer zoom.
Centrar vista.
Mostrar cuadrícula sutil.
Limitar el área de arrastre para no perder el diagrama.
Configuración sugerida en React Flow
nodesDraggable={true}
nodesConnectable={true}
elementsSelectable={true}
minZoom={0.35}
maxZoom={1.5}
fitView
fitViewOptions={{ padding: 0.25 }}

También se debe considerar:

translateExtent={[[-500, -500], [2500, 1800]]}
nodeExtent={[[-300, -300], [2200, 1600]]}
Criterios de aceptación
El usuario puede mover nodos sin perder el diagrama.
El zoom funciona correctamente.
Hay botón para centrar vista.
El canvas no se siente vacío o perdido.
La cuadrícula se ve sutil y elegante.

---
## 12. Fase 7 — Guardado del diagrama
Objetivo

Guardar correctamente el diagrama con su estructura completa.

Al presionar Guardar, se debe guardar:

Nombre del diagrama.
Tipo de diagrama.
ProjectId.
Nodos.
Relaciones.
Posiciones de nodos.
Datos internos de clases.
Datos internos de relaciones.
Estructura esperada
{
  "projectId": "PRJ-XXX",
  "type": "CLASS",
  "name": "Diagrama de clases - Glow-on-Demand",
  "nodes": [
    {
      "id": "class-usuario",
      "type": "class",
      "position": {
        "x": 100,
        "y": 120
      },
      "data": {
        "name": "Usuario",
        "attributes": [],
        "methods": []
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "class-cliente",
      "target": "class-cita",
      "data": {
        "relationshipType": "ASSOCIATION",
        "label": "realiza",
        "sourceMultiplicity": "1",
        "targetMultiplicity": "0..*"
      }
    }
  ]
}

Las posiciones x y y son obligatorias para que el diagrama se mantenga igual al abrirlo de nuevo.

Criterios de aceptación
El usuario puede guardar el diagrama.
Al volver a abrirlo, conserva nodos.
Al volver a abrirlo, conserva relaciones.
Al volver a abrirlo, conserva posiciones.
No se pierden atributos ni métodos.

13 Fase 9 — Generación con IA
Objetivo

Usar IA como asistente para acelerar la construcción del diagrama, sin quitar control al usuario.

La IA debe funcionar como asistente, no como reemplazo absoluto del usuario.

13.1 Generar diagrama completo

Botón sugerido:

Generar diagrama de clases con IA

Debe usar:

Requisitos del proyecto.
Normas activas del proyecto.
Nombre del proyecto.
Contexto del proyecto.

La IA debe devolver:

Clases sugeridas.
Atributos.
Métodos.
Relaciones.
Justificación o advertencias si aplica.

El usuario debe poder revisar antes de insertar en canvas.

13.2 Generar una clase automática

Botón sugerido:

Generar clase automática

Flujo:

Usuario escribe una idea.
IA devuelve una clase sugerida.
Usuario revisa.
Usuario inserta clase en canvas.

Ejemplo:

Quiero una clase para gestionar pagos anticipados con tarjeta y PayPal.

Resultado esperado:

Clase: Pago

Atributos:
- id: UUID
- monto: BigDecimal
- metodoPago: MetodoPago
- estado: EstadoPago
- fechaPago: LocalDateTime

Métodos:
+ procesarPago(): void
+ confirmarPago(): void
+ reembolsar(): void
Criterios de aceptación
La IA puede sugerir una clase.
La IA puede sugerir un diagrama completo.
El usuario puede aceptar o descartar sugerencias.
La IA no debe insertar automáticamente sin revisión.
La IA debe respetar normas del proyecto.

----
## 14 Uso de normas del proyecto

La IA debe tomar en cuenta las reglas activas del proyecto.

Ejemplo de normas:

- Los nombres de clases deben estar en singular.
- No se deben crear clases sin relación con requisitos existentes.
- Las relaciones deben tener multiplicidad.
- Las clases deben representar conceptos del dominio.

La generación automática no debe ignorar estas reglas.

Si una regla no se puede cumplir, la IA debe devolver una advertencia.

Criterios de aceptación
Las reglas activas llegan al prompt.
La IA usa las reglas activas.
Si no hay reglas, no falla.
Si una regla no puede cumplirse, se muestra una advertencia.

---

## 15. Validaciones importantes

Antes de guardar un diagrama:

Debe existir projectId.
Debe existir nombre del diagrama.
Debe existir tipo CLASS.
Las clases deben tener nombre.
No debe haber dos clases con el mismo nombre.
Las relaciones deben tener origen y destino.
No se deben guardar nodos corruptos.
No se deben usar datos mock.

---

16. Diseño visual esperado

El editor debe mantener la estética de SpecAtlas:

Minimalista.
Premium.
Oscuro/claro compatible.
Sin azul chillón.
Bordes suaves.
Paneles limpios.
Canvas amplio.
Controles claros.
Microinteracciones suaves.
Tipografía legible.

El canvas debe ser protagonista.

---

17. Qué NO hacer

No hacer lo siguiente:

No abrir el canvas directamente al entrar a Diagramas.
No mezclar todos los tipos de diagramas en el mismo editor.
No usar userId como projectId.
No perder las posiciones de los nodos.
No guardar clases sin nombre.
No depender de datos mock.
No escribir PlantUML como única forma de edición.
No romper los endpoints actuales.
No eliminar la generación con IA existente.
No hacer llamadas a Gemini al cargar la página sin acción del usuario.
No insertar automáticamente resultados IA sin revisión del usuario.

---

18. Orden recomendado de implementación
Paso 1

Separar la pantalla de selección de diagramas del editor visual.

Paso 2

Crear ruta específica para editor de diagrama de clases.

Paso 3

Implementar nodo visual ClassNode.

Paso 4

Permitir agregar clases manualmente.

Paso 5

Permitir editar nombre, atributos y métodos.

Paso 6

Permitir mover clases y guardar posiciones.

Paso 7

Permitir crear relaciones entre clases.

Paso 8

Permitir editar tipo de relación, multiplicidad y etiqueta.

Paso 9

Implementar guardado real del diagrama.

Paso 10

Implementar exportación PlantUML.

Paso 11

Integrar generación de clase automática con IA.

Paso 12

Integrar generación de diagrama completo con IA.

---

19. Criterios de aceptación finales

El editor de diagrama de clases estará correcto cuando:

El usuario pueda crear una clase manualmente.
El usuario pueda editar nombre, atributos y métodos.
El usuario pueda conectar clases.
El usuario pueda definir tipo de relación UML.
El usuario pueda definir multiplicidades.
El usuario pueda mover nodos libremente.
El usuario pueda guardar el diagrama.
Al abrir de nuevo, el diagrama mantenga posiciones y relaciones.
El usuario pueda exportar PlantUML.
La IA pueda generar una clase sugerida.
La IA pueda generar un diagrama completo desde requisitos.
Las normas activas del proyecto se usen en generación con IA.
El diseño sea consistente con SpecAtlas.
El build del frontend pase correctamente.

---

20. Resultado esperado

El editor debe permitir construir diagramas como este:

Usuario
├── Cliente
└── Profesional

Cliente realiza Cita
Profesional atiende Cita
Cita contiene Pago
Cliente deja Calificación
Profesional ofrece Servicio

Y exportarlo a PlantUML correctamente.

---

21. Nota para Antigravity

Implementar por fases.

No intentar hacer todo en un solo cambio gigante.

Orden recomendado:

Fase 1: biblioteca de diagramas + rutas
Fase 2: editor manual básico
Fase 3: nodo visual de clase
Fase 4: atributos y métodos
Fase 5: relaciones UML
Fase 6: guardado
Fase 7: PlantUML
Fase 8: IA

Primero dejar el editor manual funcionando.

Después agregar relaciones.

Después guardar/exportar.

Finalmente integrar IA.