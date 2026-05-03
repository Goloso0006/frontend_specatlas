import {
  ReactFlow,
  Background,
  Handle,
  Position,
  BackgroundVariant,
  Panel,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import type { Edge, Node, NodeProps, CoordinateExtent } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

type HeroNodeData = {
  label: string;
  desc: string;
  tone: 'core' | 'input' | 'requirement' | 'analysis' | 'diagram' | 'storage';
};

type HeroNode = Node<HeroNodeData, 'hero'>;

const HERO_BOUNDS: CoordinateExtent = [[-120, 40], [1120, 720]];

// === LÍMITES CORREGIDOS ===
// X: [0, 980] -> Mantiene el bloqueo horizontal.
// Y: [60, 800] -> 60 protege el título arriba, 800 te da libertad total hacia abajo dentro de la tarjeta.
const NODE_EXTENT: CoordinateExtent = [[0, 60], [980, 800]];

function nodeSurfaceTone(tone: HeroNodeData['tone']) {
  switch (tone) {
    case 'core': return 'border-[rgba(224,224,224,0.22)] shadow-[0_0_0_1px_rgba(224,224,224,0.05),0_20px_60px_rgba(0,0,0,0.4)]';
    case 'input': return 'border-[rgba(224,224,224,0.16)] shadow-[0_0_0_1px_rgba(224,224,224,0.04),0_16px_40px_rgba(0,0,0,0.35)]';
    case 'requirement': return 'border-[rgba(224,224,224,0.18)] shadow-[0_0_0_1px_rgba(224,224,224,0.04),0_14px_32px_rgba(0,0,0,0.30)]';
    case 'analysis': return 'border-[rgba(224,224,224,0.15)] shadow-[0_0_0_1px_rgba(224,224,224,0.03),0_14px_32px_rgba(0,0,0,0.28)]';
    case 'diagram': return 'border-[rgba(224,224,224,0.20)] shadow-[0_0_0_1px_rgba(224,224,224,0.04),0_18px_40px_rgba(0,0,0,0.35)]';
    case 'storage': return 'border-[rgba(224,224,224,0.14)] shadow-[0_0_0_1px_rgba(224,224,224,0.03),0_12px_28px_rgba(0,0,0,0.26)]';
  }
}

function nodeAccentTone(tone: HeroNodeData['tone']) {
  switch (tone) {
    case 'core': return 'bg-[#E0E0E0] text-[#181818]';
    case 'input': return 'bg-[#565656] text-[#F2F2F2]';
    case 'requirement': return 'bg-[#2F2F2F] text-[#F2F2F2]';
    case 'analysis': return 'bg-[#3A3A3A] text-[#F2F2F2]';
    case 'diagram': return 'bg-[#4A4A4A] text-[#F2F2F2]';
    case 'storage': return 'bg-[#333333] text-[#E0E0E0]';
  }
}

function NodeShell({ data, selected }: NodeProps<HeroNode>) {
  const toneClass = nodeSurfaceTone(data.tone);
  const accentClass = nodeAccentTone(data.tone);

  return (
    <div
      className={[
        'group relative min-w-[230px] min-h-[110px] rounded-[24px] flex flex-col justify-center border bg-[#2B2B2B]/96 px-5 py-4 backdrop-blur-sm transition-colors duration-300 cursor-grab active:cursor-grabbing',
        'hover:border-[rgba(224,224,224,0.35)]',
        selected ? 'ring-1 ring-[rgba(224,224,224,0.3)] bg-[#333]' : '',
        toneClass,
      ].join(' ')}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_60%)]" />
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !border-2 !border-[rgba(224,224,224,0.2)] !bg-[#181818]" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !border-2 !border-[rgba(224,224,224,0.2)] !bg-[#181818]" />
      
      <div className={`mb-2.5 inline-flex self-start rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] ${accentClass}`}>
        {data.tone === 'core' ? 'core ai' : data.tone === 'input' ? 'origen' : data.tone === 'requirement' ? 'req' : data.tone === 'diagram' ? 'uml' : data.tone === 'analysis' ? 'análisis' : 'storage'}
      </div>
      <div className="relative z-10 text-[16px] font-bold leading-snug tracking-tight text-[#F2F2F2]">
        {data.label}
      </div>
      <div className="relative z-10 mt-1 text-[12px] leading-relaxed text-[#B3B3B3]">
        {data.desc}
      </div>
    </div>
  );
}

const nodeTypes = { hero: NodeShell };

const initialNodes: HeroNode[] = [
  { id: 'input', type: 'hero', position: { x: 50, y: 110 }, data: { label: 'Historias de Usuario', desc: 'Ingreso de requerimientos crudos', tone: 'input' } },
  { id: 'core', type: 'hero', position: { x: 350, y: 110 }, data: { label: 'SpecAtlas Engine', desc: 'Análisis semántico avanzado', tone: 'core' } },
  { id: 'rf1', type: 'hero', position: { x: 100, y: 300 }, data: { label: 'Autenticación Core', desc: 'REQ Funcional Validado', tone: 'requirement' } },
  { id: 'rnf1', type: 'hero', position: { x: 350, y: 300 }, data: { label: 'Cifrado de Datos', desc: 'REQ No Funcional de Seguridad', tone: 'requirement' } },
  { id: 'trace', type: 'hero', position: { x: 620, y: 300 }, data: { label: 'Matriz de Trazabilidad', desc: 'Resolución de conflictos', tone: 'analysis' } },
  { id: 'uml1', type: 'hero', position: { x: 220, y: 490 }, data: { label: 'Modelo de Clases', desc: 'PlantUML estructural', tone: 'diagram' } },
  { id: 'uml2', type: 'hero', position: { x: 500, y: 490 }, data: { label: 'Casos de Uso', desc: 'PlantUML de comportamiento', tone: 'diagram' } },
  { id: 'db', type: 'hero', position: { x: 750, y: 490 }, data: { label: 'Vector Store DB', desc: 'Almacenamiento de embeddings', tone: 'storage' } },
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'input', target: 'core', animated: true, style: { stroke: 'rgba(224,224,224,0.5)', strokeWidth: 2 } },
  { id: 'e2', source: 'core', target: 'rf1', animated: true, style: { stroke: 'rgba(224,224,224,0.35)', strokeWidth: 1.5 } },
  { id: 'e3', source: 'core', target: 'rnf1', animated: true, style: { stroke: 'rgba(224,224,224,0.35)', strokeWidth: 1.5 } },
  { id: 'e4', source: 'core', target: 'trace', style: { stroke: 'rgba(224,224,224,0.3)', strokeWidth: 1.5, strokeDasharray: '4 4' } },
  { id: 'e5', source: 'trace', target: 'uml1', style: { stroke: 'rgba(224,224,224,0.2)', strokeWidth: 1.2 } },
  { id: 'e6', source: 'trace', target: 'uml2', style: { stroke: 'rgba(224,224,224,0.2)', strokeWidth: 1.2 } },
  { id: 'e7', source: 'trace', target: 'db', style: { stroke: 'rgba(224,224,224,0.2)', strokeWidth: 1.2 } },
];

export function HeroFlowGraph() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <section className="relative w-full overflow-hidden rounded-2xl border border-[rgba(224,224,224,0.12)] bg-[#181818] shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_38%),radial-gradient(circle_at_75%_20%,rgba(255,255,255,0.035),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%)]" />
      
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(224,224,224,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(224,224,224,0.04)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />

      <div className="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-3 pointer-events-none">
        <div className="rounded-full border border-[rgba(224,224,224,0.12)] bg-[#2B2B2B]/90 px-4 py-2 backdrop-blur-md shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E0E0E0]">SpecAtlas Architecture</div>
        </div>
      </div>

      {/* Volví al tamaño original de la tarjeta/contenedor principal */}
      <div className="h-[500px] min-[640px]:h-[600px] lg:h-[650px] cursor-default">
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes} 
          fitView 
          fitViewOptions={{ padding: 0.15 }}
          
          zoomOnScroll={false} 
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          panOnDrag={false} 
          panOnScroll={false} 
          preventScrolling={true}
          
          translateExtent={HERO_BOUNDS} 
          nodeExtent={NODE_EXTENT} 
          
          nodesDraggable={true}
          nodesConnectable={false} 
          elementsSelectable={true}
          
          proOptions={{ hideAttribution: true }} 
          defaultEdgeOptions={{ type: 'smoothstep', style: { stroke: 'rgba(224,224,224,0.28)', strokeWidth: 1.2 } }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="rgba(224,224,224,0.15)" />
          
          <Panel position="bottom-center" className="mb-6">
             <div className="bg-[#1e1e1e]/80 backdrop-blur-md border border-[#333] px-5 py-2.5 rounded-xl text-[11px] tracking-wider font-semibold text-[#a3a3a3] flex gap-3 shadow-xl">
               <span className="text-white inline-flex items-center"><img src="/iconKnowledgeGraph/noun-tips-7740167.svg" alt="Tip" className="w-4 h-4 mr-1.5" />Tip:</span> 
               <span>Arrastra las tarjetas para interactuar con la arquitectura.</span>
             </div>
          </Panel>

        </ReactFlow>
      </div>
    </section>
  );
}

export default HeroFlowGraph;