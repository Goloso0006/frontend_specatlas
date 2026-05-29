import React, { useReducer, useRef, useState } from 'react';
import { DataStructureFacade, type SupportedDataStructure } from '../facades/data-structures/DataStructureFacade';
import { playbackReducer, initialPlaybackState } from '../state/playback-workshop/playbackReducer';
import { PlaybackControls } from '../components/playback-workshop/PlaybackControls';
import { VisualizerCanvas } from '../components/playback-workshop/VisualizerCanvas';

const DS_OPTIONS: { value: SupportedDataStructure, label: string }[] = [
  { value: 'ARRAY', label: 'Array' },
  { value: 'STACK', label: 'Stack' },
  { value: 'QUEUE', label: 'Queue' },
  { value: 'SINGLY_LINKED_LIST', label: 'Singly Linked List' },
  { value: 'DOUBLY_LINKED_LIST', label: 'Doubly Linked List' },
  { value: 'CIRCULAR_DOUBLY_LINKED_LIST', label: 'Circular Doubly Linked List' }
];

export const PlaybackWorkshopPage: React.FC = () => {
  const facadeRef = useRef<DataStructureFacade<number>>(new DataStructureFacade<number>());
  const [playbackState, dispatch] = useReducer(playbackReducer, initialPlaybackState);
  
  const [items, setItems] = useState<any[]>([]);
  const [structureType, setStructureType] = useState<SupportedDataStructure | null>(null);
  const [inputValue, setInputValue] = useState('');

  // Update visual state
  const syncVisuals = () => {
    setItems(facadeRef.current.toArray());
  };

  const handleStructureChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as SupportedDataStructure;
    setStructureType(type);
    facadeRef.current.initStructure(type);
    dispatch({ type: 'STOP' });
    syncVisuals();
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Example Animation: Search step-by-step
  const handleSearch = async () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      dispatch({ type: 'SET_ERROR', payload: 'Invalid input value' });
      return;
    }

    dispatch({ type: 'PLAY' });
    
    // Simulate finding it node by node
    const currentItems = facadeRef.current.toArray();
    let found = false;
    
    for (let i = 0; i < currentItems.length; i++) {
      // Check if user stopped or paused
      // (In a full real app, we'd use a ref to check the latest state during the async loop)
      
      dispatch({ type: 'SET_HIGHLIGHT', payload: [i] });
      await delay(playbackState.speed);
      
      const nodeValue = typeof currentItems[i] === 'object' ? (currentItems[i] as any).value : currentItems[i];
      if (nodeValue === val) {
        found = true;
        dispatch({ type: 'SET_HIGHLIGHT', payload: [i] }); // Keep it highlighted
        break;
      }
    }

    if (!found) {
      dispatch({ type: 'SET_ERROR', payload: `Value ${val} not found.` });
    } else {
      dispatch({ type: 'STOP' }); // Or pause on the found item
      dispatch({ type: 'CLEAR_ERROR' });
    }
  };

  const handleInsert = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) return;
    facadeRef.current.insert(val);
    syncVisuals();
    setInputValue('');
  };

  const handleDelete = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) return;
    const deleted = facadeRef.current.delete(val);
    if (!deleted) {
      dispatch({ type: 'SET_ERROR', payload: `Value ${val} not found to delete.` });
    } else {
      dispatch({ type: 'CLEAR_ERROR' });
    }
    syncVisuals();
    setInputValue('');
  };

  const handleClear = () => {
    facadeRef.current.clear();
    syncVisuals();
    dispatch({ type: 'STOP' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden">
      
      {/* Header */}
      <header className="px-8 py-6 border-b border-white/10 bg-black/40 backdrop-blur-md relative z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text tracking-tight">
              Playback Workshop
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">Interactive Data Structures Visualizer</p>
          </div>

          <div className="flex items-center space-x-4">
            <select 
              value={structureType || ''} 
              onChange={handleStructureChange}
              className="bg-slate-900 border border-indigo-500/30 text-indigo-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none font-medium shadow-lg"
            >
              <option value="" disabled>Select Data Structure...</option>
              {DS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-6 relative">
        
        {/* Error Banner */}
        {playbackState.errorMessage && (
          <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center shadow-lg animate-fade-in">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="font-medium">{playbackState.errorMessage}</span>
          </div>
        )}

        {/* Visualizer Area */}
        <div className="flex-1 flex flex-col bg-black/20 rounded-3xl border border-white/5 shadow-2xl overflow-hidden mb-6 relative">
          <VisualizerCanvas 
            items={items} 
            structureType={structureType} 
            highlightedIndices={playbackState.highlightedIndices} 
          />
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl">
          
          {/* Action Controls */}
          <div className="flex items-center space-x-3">
            <input 
              type="number" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Value..."
              disabled={!structureType || playbackState.status === 'playing'}
              className="w-32 bg-black/40 border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
            />
            <button 
              onClick={handleInsert}
              disabled={!structureType || playbackState.status === 'playing' || !inputValue}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              Insert
            </button>
            <button 
              onClick={handleSearch}
              disabled={!structureType || playbackState.status === 'playing' || !inputValue || items.length === 0}
              className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
            >
              Search
            </button>
            <button 
              onClick={handleDelete}
              disabled={!structureType || playbackState.status === 'playing' || !inputValue}
              className="bg-rose-600/80 hover:bg-rose-500 text-white px-5 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-rose-500/50"
            >
              Delete
            </button>
            
            <div className="w-px h-8 bg-white/10 mx-2"></div>
            
            <button 
              onClick={handleClear}
              disabled={!structureType || playbackState.status === 'playing' || items.length === 0}
              className="text-slate-400 hover:text-white px-4 py-2 transition-colors disabled:opacity-50"
            >
              Clear All
            </button>
          </div>

          {/* Playback Controls Machine */}
          <PlaybackControls state={playbackState} dispatch={dispatch} />

        </div>
      </main>

    </div>
  );
};

export default PlaybackWorkshopPage;
