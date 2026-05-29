import React from 'react';
import { VisualNode } from './nodes/VisualNode';
import { type SupportedDataStructure } from '../../facades/data-structures/DataStructureFacade';

interface VisualizerCanvasProps {
  items: any[];
  highlightedIndices: number[];
  structureType: SupportedDataStructure | null;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({ 
  items, 
  highlightedIndices,
  structureType 
}) => {
  if (!structureType) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/10 rounded-3xl m-4 bg-black/20">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
        <p className="text-lg font-medium tracking-wide">Select a data structure to begin</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center border-2 border-white/5 rounded-3xl m-4 bg-black/20 shadow-inner">
        <p className="text-slate-400 italic">The {structureType.replace(/_/g, ' ').toLowerCase()} is empty. Insert a value.</p>
      </div>
    );
  }

  // Determine layout direction based on structure type
  const isStack = structureType === 'STACK';
  const containerClasses = isStack 
    ? "flex flex-col-reverse items-center justify-center space-y-reverse space-y-2 py-12" // Stack goes up
    : "flex flex-row items-center overflow-x-auto p-12 custom-scrollbar"; // Others go right

  return (
    <div className={`flex-1 relative rounded-3xl m-4 bg-slate-900/40 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-sm ${containerClasses}`}>
      {/* Background Grid Pattern for aesthetics */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      
      {items.map((item, index) => (
        <div key={item.id || index} className={isStack ? "w-full flex justify-center" : "flex-shrink-0"}>
          <VisualNode 
            value={item.value || item} // For raw Array vs Node objects
            id={item.id || String(index)}
            isHighlighted={highlightedIndices.includes(index)}
            structureType={structureType}
            index={index}
            totalNodes={items.length}
          />
        </div>
      ))}
    </div>
  );
};
