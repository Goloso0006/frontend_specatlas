import { useReducer } from 'react'
import {
  createDiagramEditorState,
  diagramEditorReducer,
  type DiagramEditorAction,
  type DiagramEditorState,
} from './diagramEditor.machine'

export interface DiagramEditorStore {
  state: DiagramEditorState
  actions: {
    idle: (message?: string) => void
    loading: (message?: string) => void
    editing: (message?: string) => void
    saving: (message?: string) => void
    exporting: (message?: string) => void
    error: (message: string) => void
    reset: () => void
  }
}

export function useDiagramEditorStore(initialState: DiagramEditorState = createDiagramEditorState()): DiagramEditorStore {
  const [state, dispatch] = useReducer(diagramEditorReducer, initialState)

  const send = (action: DiagramEditorAction) => dispatch(action)

  return {
    state,
    actions: {
      idle: (message) => send({ type: 'IDLE', message }),
      loading: (message) => send({ type: 'LOADING', message }),
      editing: (message) => send({ type: 'EDITING', message }),
      saving: (message) => send({ type: 'SAVING', message }),
      exporting: (message) => send({ type: 'EXPORTING', message }),
      error: (message) => send({ type: 'ERROR', message }),
      reset: () => send({ type: 'RESET' }),
    },
  }
}
