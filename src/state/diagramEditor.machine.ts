export type DiagramEditorStatus = 'idle' | 'loading' | 'editing' | 'saving' | 'exporting' | 'error'

export interface DiagramEditorState {
  status: DiagramEditorStatus
  message: string
}

export type DiagramEditorAction =
  | { type: 'IDLE'; message?: string }
  | { type: 'LOADING'; message?: string }
  | { type: 'EDITING'; message?: string }
  | { type: 'SAVING'; message?: string }
  | { type: 'EXPORTING'; message?: string }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' }

export function createDiagramEditorState(): DiagramEditorState {
  return {
    status: 'idle',
    message: 'Listo para editar diagramas',
  }
}

export function diagramEditorReducer(
  state: DiagramEditorState,
  action: DiagramEditorAction,
): DiagramEditorState {
  switch (action.type) {
    case 'IDLE':
      return {
        status: 'idle',
        message: action.message ?? 'Listo para editar diagramas',
      }
    case 'LOADING':
      return {
        status: 'loading',
        message: action.message ?? 'Cargando diagrama...',
      }
    case 'EDITING':
      return {
        status: 'editing',
        message: action.message ?? 'Diagrama listo para editar',
      }
    case 'SAVING':
      return {
        status: 'saving',
        message: action.message ?? 'Guardando diagrama...',
      }
    case 'EXPORTING':
      return {
        status: 'exporting',
        message: action.message ?? 'Exportando diagrama...',
      }
    case 'ERROR':
      return {
        status: 'error',
        message: action.message,
      }
    case 'RESET':
      return createDiagramEditorState()
    default:
      return state
  }
}
