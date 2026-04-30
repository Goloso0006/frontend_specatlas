# Sistema de Manejo de Carga y Errores

## Arquitectura

```
main.tsx
└── LoadingErrorProvider        ← Contexto global
    ├── App                     ← Rutas + páginas
    ├── LoadingOverlay          ← Spinner fullscreen (auto)
    └── ErrorToast              ← Cola de errores (auto)
```

El sistema se compone de tres capas:

1. **Contexto** (`LoadingErrorContext.ts`) — define la interfaz del estado global.
2. **Provider** (`LoadingErrorProvider.tsx`) — mantiene un contador de operaciones activas y una cola de errores con auto-dismiss.
3. **Hooks** (`useLoadingError.ts`) — dos hooks para consumir el contexto.

---

## API de los Hooks

### `useLoadingError()`

Acceso directo al contexto. Retorna:

| Propiedad | Tipo | Descripción |
|---|---|---|
| `isLoading` | `boolean` | `true` si hay al menos 1 operación activa |
| `activeOperations` | `number` | Contador de operaciones concurrentes |
| `errors` | `ErrorEntry[]` | Cola de errores activos |
| `startLoading()` | `() => void` | Incrementa el contador |
| `stopLoading()` | `() => void` | Decrementa el contador (min 0) |
| `addError(msg, retry?)` | `(string, fn?) => void` | Agrega un error a la cola |
| `clearError(id)` | `(string) => void` | Elimina un error específico |
| `clearAllErrors()` | `() => void` | Limpia toda la cola |

### `useApiOperation()`

Hook de conveniencia que envuelve operaciones async con loading/error automático.

```tsx
const { run } = useApiOperation()

// Uso básico
const data = await run(() => projectsApi.create(payload))

// Con mensaje de error personalizado
const data = await run(
  () => projectsApi.create(payload),
  { errorMessage: 'No fue posible crear el proyecto.' }
)

// Con callback de reintento
const data = await run(
  () => projectsApi.create(payload),
  {
    errorMessage: 'Error al crear proyecto.',
    retry: () => handleCreate()
  }
)
```

**Retorna:** `T | null` — los datos si tuvo éxito, `null` si falló.

---

## Migración de Código Existente

### Antes (patrón manual)

```tsx
async function handleSave() {
  try {
    setStatus('Guardando...')
    const data = await projectsApi.create(payload)
    setProject(data)
    setStatus('Guardado correctamente.')
  } catch {
    setStatus('No fue posible guardar.')
  }
}
```

### Después (con useApiOperation)

```tsx
const { run } = useApiOperation()

async function handleSave() {
  const data = await run(
    () => projectsApi.create(payload),
    { errorMessage: 'No fue posible guardar.' }
  )
  if (data) setProject(data)
}
```

**Ventajas:**
- Sin `try/catch` manual
- Loading spinner automático (global)
- Error toast automático con retry opcional
- Operaciones concurrentes correctas

---

## Componentes Visuales

### `LoadingOverlay`

- Spinner fullscreen con backdrop blur
- Se muestra automáticamente cuando `isLoading === true`
- No requiere configuración — está montado en `main.tsx`

### `ErrorToast`

- Stack de toasts en esquina inferior derecha
- Auto-dismiss después de **6 segundos**
- Botón "Cerrar" para dismiss manual
- Botón "Reintentar" si el error incluye callback `retry`
- Soporta errores múltiples simultáneos
- `aria-live="polite"` para accesibilidad

---

## Tests

Ejecutar:

```bash
npm test           # una sola vez
npm run test:watch # modo watch
```

### Cobertura de tests (23 tests)

**`useLoadingError` (14 tests):**
- Estado inicial (sin loading, sin errores)
- Incremento/decremento de contador
- Protección contra valores negativos
- Agregar errores a la cola
- Errores múltiples concurrentes
- Eliminar error por ID
- Limpiar todos los errores
- Auto-dismiss a 6 segundos
- Callback de retry
- `useApiOperation`: éxito, fallo, mensaje custom
- `useApiOperation`: gestión de loading durante operación
- `useApiOperation`: operaciones concurrentes

**`UI Components` (9 tests):**
- LoadingOverlay no renderiza sin loading
- LoadingOverlay muestra spinner con loading
- ErrorToast no renderiza sin errores
- ErrorToast muestra mensaje de error
- ErrorToast muestra/oculta botón retry
- ErrorToast dismiss manual
- ErrorToast auto-dismiss
- ErrorToast errores múltiples

---

## Archivos del Sistema

```
src/
├── context/
│   ├── LoadingErrorContext.ts       ← Tipos + createContext
│   └── LoadingErrorProvider.tsx     ← Provider (contador + cola + timers)
├── hooks/
│   └── useLoadingError.ts           ← useLoadingError() + useApiOperation()
├── components/ui/
│   ├── LoadingOverlay.tsx           ← Spinner global
│   └── ErrorToast.tsx               ← Stack de toasts
└── test/
    ├── setup.ts                     ← Config jest-dom
    ├── useLoadingError.test.tsx     ← 14 tests
    └── ui-components.test.tsx       ← 9 tests
```
