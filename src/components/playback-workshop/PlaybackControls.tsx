import React from 'react';
import type { PlaybackState, PlaybackAction } from '../../state/playback-workshop/playbackReducer';

interface PlaybackControlsProps {
  state: PlaybackState;
  dispatch: React.Dispatch<PlaybackAction>;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({ state, dispatch }) => {
  const isPlaying = state.status === 'playing';

  return (
    <div className="flex items-center space-x-4 bg-slate-900/50 p-3 rounded-2xl border border-white/10 backdrop-blur-lg shadow-xl">
      <button
        onClick={() => dispatch({ type: isPlaying ? 'PAUSE' : 'PLAY' })}
        className={`p-3 rounded-xl flex items-center justify-center transition-all duration-300 ${
          isPlaying 
            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30' 
            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
        }`}
        title={isPlaying ? "Pause Animation" : "Play Animation"}
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>

      <button
        onClick={() => dispatch({ type: 'STOP' })}
        disabled={state.status === 'idle'}
        className="p-3 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Stop & Reset"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>
      </button>

      <div className="w-px h-8 bg-white/10 mx-2"></div>

      {/* Speed Control */}
      <div className="flex flex-col px-2">
        <label className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Speed</label>
        <input 
          type="range" 
          min="100" 
          max="2000" 
          step="100"
          value={state.speed}
          onChange={(e) => dispatch({ type: 'SET_SPEED', payload: Number(e.target.value) })}
          className="w-24 accent-indigo-500"
          style={{ direction: 'rtl' }} // Reverse so left is slower (higher ms), right is faster (lower ms)
          title={`${state.speed}ms per step`}
        />
      </div>

      {/* Status indicator */}
      <div className="ml-auto flex items-center space-x-2 px-4 py-1.5 rounded-full bg-black/30 border border-white/5">
        <div className={`w-2 h-2 rounded-full ${
          state.status === 'playing' ? 'bg-emerald-400 animate-pulse' :
          state.status === 'paused' ? 'bg-amber-400' :
          state.status === 'error' ? 'bg-rose-500' : 'bg-slate-500'
        }`}></div>
        <span className="text-xs font-medium text-slate-300 capitalize">{state.status}</span>
      </div>
    </div>
  );
};
