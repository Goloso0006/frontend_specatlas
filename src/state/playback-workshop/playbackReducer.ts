export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'error';

export interface PlaybackState {
  status: PlaybackStatus;
  speed: number;
  errorMessage: string | null;
  // We can add more animation state tracking here like current node index being highlighted, etc.
  highlightedIndices: number[];
}

export type PlaybackAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'STOP' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_SPEED'; payload: number }
  | { type: 'SET_HIGHLIGHT'; payload: number[] }
  | { type: 'CLEAR_HIGHLIGHT' };

export const initialPlaybackState: PlaybackState = {
  status: 'idle',
  speed: 1000, // 1000ms per step
  errorMessage: null,
  highlightedIndices: [],
};

export function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case 'PLAY':
      if (state.status === 'error') return state; // Don't play if in error state without clearing
      return { ...state, status: 'playing', errorMessage: null };
      
    case 'PAUSE':
      if (state.status !== 'playing') return state;
      return { ...state, status: 'paused' };
      
    case 'STOP':
      return { ...state, status: 'idle', highlightedIndices: [], errorMessage: null };
      
    case 'SET_ERROR':
      return { ...state, status: 'error', errorMessage: action.payload, highlightedIndices: [] };
      
    case 'CLEAR_ERROR':
      return { ...state, status: 'idle', errorMessage: null };
      
    case 'SET_SPEED':
      return { ...state, speed: action.payload };
      
    case 'SET_HIGHLIGHT':
      return { ...state, highlightedIndices: action.payload };
      
    case 'CLEAR_HIGHLIGHT':
      return { ...state, highlightedIndices: [] };
      
    default:
      return state;
  }
}
