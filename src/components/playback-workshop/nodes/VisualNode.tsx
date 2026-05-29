import React from 'react';
import { type SupportedDataStructure } from '../../../facades/data-structures/DataStructureFacade';

interface VisualNodeProps {
  value: any;
  id: string;
  isHighlighted?: boolean;
  structureType: SupportedDataStructure | null;
  index: number;
  totalNodes: number;
}

export const VisualNode: React.FC<VisualNodeProps> = ({ 
  value, 
  id, 
  isHighlighted, 
  structureType,
  index,
  totalNodes
}) => {
  const isLinkedList = structureType?.includes('LINKED_LIST');
  const isDoubly = structureType?.includes('DOUBLY');
  const isCircular = structureType === 'CIRCULAR_DOUBLY_LINKED_LIST';

  const isLast = index === totalNodes - 1;
  const isFirst = index === 0;

  return (
    <div className="flex items-center transition-all duration-500 ease-in-out">
      {/* Previous Arrow for Doubly Linked Lists */}
      {isDoubly && !isFirst && (
        <div className="flex items-center justify-center w-8 h-full text-indigo-400 opacity-70">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
        </div>
      )}

      {/* Node Container (Glassmorphism) */}
      <div 
        id={`node-${id}`}
        className={`
          relative flex items-center justify-center
          min-w-[4rem] min-h-[4rem] px-4 py-2 rounded-xl
          backdrop-blur-md border border-white/20
          shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
          transition-all duration-300 ease-in-out transform hover:scale-105
          ${isHighlighted 
            ? 'bg-gradient-to-br from-indigo-500/80 to-purple-600/80 ring-2 ring-white/50 text-white shadow-indigo-500/50' 
            : 'bg-white/10 text-slate-100 hover:bg-white/20'}
        `}
      >
        <div className="flex flex-col items-center">
          <span className="text-xs text-white/50 mb-1 font-mono">{index}</span>
          <span className="text-xl font-bold font-mono tracking-tight">
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      </div>

      {/* Next Arrow for Linked Lists */}
      {isLinkedList && (!isLast || isCircular) && (
        <div className="flex items-center justify-center w-12 h-full text-indigo-400 opacity-70">
          <div className="relative flex items-center w-full">
            <div className="w-full h-0.5 bg-indigo-400/50 rounded"></div>
            <svg className="absolute right-0 w-4 h-4 translate-x-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>
      )}

      {/* Visual cue for circular reference returning to head */}
      {isCircular && isLast && (
        <div className="absolute top-[-2rem] left-8 right-8 h-[2rem] border-t-2 border-r-2 border-indigo-400/30 rounded-tr-xl border-dashed pointer-events-none"></div>
      )}
    </div>
  );
};
