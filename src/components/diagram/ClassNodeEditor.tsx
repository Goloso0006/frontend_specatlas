import { useState, useEffect } from 'react'
import type {
  DiagramClassAttributeDTO,
  DiagramClassMethodDTO,
  DiagramClassNodeDTO,
  DiagramNodeDTO,
  VisibilityType
} from '../../types/diagrams'
import { generateSafeId } from '../../utils/diagramMapper'
import { buildConstructorMethod, buildGetterMethod, buildSetterMethod } from '../../utils/classMethodUtils'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

type EditorView = 'MAIN' | 'ATTRIBUTES_LIST' | 'ATTRIBUTE_FORM' | 'METHODS_LIST' | 'METHOD_FORM' | 'ENUM_VALUES'

interface ClassNodeEditorProps {
  node: DiagramClassNodeDTO
  nodes: DiagramNodeDTO[]
  onChange: (node: DiagramClassNodeDTO) => void
  onSubScreenChange?: (isSubScreen: boolean) => void
  initialTabPreference?: string | null
  onClearTabPreference?: () => void
}

export function ClassNodeEditor({
  node,
  nodes,
  onChange,
  onSubScreenChange,
  initialTabPreference,
  onClearTabPreference,
}: ClassNodeEditorProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'attributes' | 'methods' | 'enum' | 'appearance'>('summary')
  const [view, setView] = useState<EditorView>('MAIN')
  const [selectedAttrId, setSelectedAttrId] = useState<string | null>(null)
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null)
  const [advancedEnumMode, setAdvancedEnumMode] = useState(false)

  useEffect(() => {
    if (onSubScreenChange) {
      onSubScreenChange(view !== 'MAIN')
    }
  }, [view, onSubScreenChange])

  // Handle initial tab preferences from quick buttons
  useEffect(() => {
    if (initialTabPreference === 'attributes') {
      setActiveTab('attributes')
      setView('MAIN')
      onClearTabPreference?.()
    } else if (initialTabPreference === 'methods') {
      setActiveTab('methods')
      setView('MAIN')
      onClearTabPreference?.()
    }
  }, [initialTabPreference, onClearTabPreference])

  const umlType = node.umlType || 'CLASS'
  const isEnum = umlType === 'ENUM'
  const isInterface = umlType === 'INTERFACE'

  const attributes = Array.isArray(node.attributes) ? node.attributes : []
  const methods = Array.isArray(node.methods) ? node.methods : []
  const enumValues = Array.isArray(node.enumValues) ? node.enumValues : []

  const availableEnums = nodes
    .filter(n => n.kind === 'class' && (n as DiagramClassNodeDTO).umlType === 'ENUM')
    .map(n => n.name)

  // ── Navigation ──
  const goToAddAttribute = () => { setSelectedAttrId(null); setView('ATTRIBUTE_FORM'); }
  const goToEditAttribute = (id: string) => { setSelectedAttrId(id); setView('ATTRIBUTE_FORM'); }
  const goToAddMethod = () => { setSelectedMethodId(null); setView('METHOD_FORM'); }
  const goToEditMethod = (id: string) => { setSelectedMethodId(id); setView('METHOD_FORM'); }

  // ── Rendering sub-views inside the Tab context ──
  if (view === 'ATTRIBUTE_FORM') {
    return (
      <AttributeForm
        attribute={attributes.find(a => a.id === selectedAttrId)}
        availableEnums={availableEnums}
        onBack={() => setView('MAIN')}
        onSave={(attr: DiagramClassAttributeDTO) => {
          const nextAttrs = selectedAttrId 
            ? attributes.map(a => a.id === selectedAttrId ? attr : a)
            : [...attributes, { ...attr, id: generateSafeId() }]
          onChange({ ...node, attributes: nextAttrs })
          setView('MAIN')
        }}
      />
    )
  }

  if (view === 'METHOD_FORM') {
    return (
      <MethodForm
        method={methods.find(m => m.id === selectedMethodId)}
        availableEnums={availableEnums}
        onBack={() => setView('MAIN')}
        onSave={(method: DiagramClassMethodDTO) => {
          const nextMethods = selectedMethodId 
            ? methods.map(m => m.id === selectedMethodId ? method : m)
            : [...methods, { ...method, id: generateSafeId() }]
          onChange({ ...node, methods: nextMethods })
          setView('MAIN')
        }}
      />
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300 flex flex-col h-full">
      {/* Header Info */}
      <header className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide truncate max-w-[180px]" title={node.name}>
            {node.name || 'Nueva Clase'}
          </h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1 inline-block">
            {umlType}
          </span>
        </div>
      </header>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-2 overflow-x-auto shrink-0 select-none">
        <button
          onClick={() => { setActiveTab('summary'); setView('MAIN'); }}
          className={`py-2 px-2 text-xs font-bold text-center border-b-2 transition-all truncate flex-1 ${activeTab === 'summary' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          General
        </button>

        {isEnum ? (
          <button
            onClick={() => { setActiveTab('enum'); setView('MAIN'); }}
            className={`py-2 px-2 text-xs font-bold text-center border-b-2 transition-all truncate flex-1 ${activeTab === 'enum' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Valores ({enumValues.length})
          </button>
        ) : null}

        {(!isEnum || advancedEnumMode) && (
          <>
            {!isInterface && (
              <button
                onClick={() => { setActiveTab('attributes'); setView('MAIN'); }}
                className={`py-2 px-2 text-xs font-bold text-center border-b-2 transition-all truncate flex-1 ${activeTab === 'attributes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Atributos ({attributes.length})
              </button>
            )}
            <button
              onClick={() => { setActiveTab('methods'); setView('MAIN'); }}
              className={`py-2 px-2 text-xs font-bold text-center border-b-2 transition-all truncate flex-1 ${activeTab === 'methods' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Métodos ({methods.length})
            </button>
          </>
        )}

        <button
          onClick={() => { setActiveTab('appearance'); setView('MAIN'); }}
          className={`py-2 px-2 text-xs font-bold text-center border-b-2 transition-all truncate flex-1 ${activeTab === 'appearance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Diseño
        </button>
      </div>

      {/* Scrollable Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <Input
              label="Nombre de la clase"
              value={node.name}
              onChange={(e) => onChange({ ...node, name: e.target.value })}
              maxLength={50}
            />

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Estereotipo / Descripción</label>
              <textarea
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:border-blue-500 outline-none min-h-[80px]"
                value={(node as any).description || ''}
                onChange={(e) => onChange({ ...node, description: e.target.value } as any)}
                placeholder="Descripción o estereotipo..."
                maxLength={100}
              />
            </div>

            {isEnum && (
              <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={advancedEnumMode}
                  onChange={(e) => setAdvancedEnumMode(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Modo Enum Avanzado</span>
                  <span className="text-[9px] text-zinc-400">Permite añadir atributos y métodos al Enum</span>
                </div>
              </label>
            )}
          </div>
        )}

        {/* ENUM VALUES TAB */}
        {activeTab === 'enum' && isEnum && (
          <div className="animate-in fade-in duration-200">
            <EnumValuesPanel
              values={enumValues}
              onAdd={() => {
                const nextVal = enumValues.length + 1
                onChange({ ...node, enumValues: [...enumValues, { id: generateSafeId(), name: `VALOR_${nextVal}` }] })
              }}
              onChange={(vals: typeof enumValues) => onChange({ ...node, enumValues: vals })}
            />
          </div>
        )}

        {/* ATTRIBUTES TAB */}
        {activeTab === 'attributes' && (!isEnum || advancedEnumMode) && !isInterface && (
          <div className="animate-in fade-in duration-200">
            <AttributesList
              attributes={attributes}
              onAdd={goToAddAttribute}
              onEdit={goToEditAttribute}
              onDelete={(id: string) => onChange({ ...node, attributes: attributes.filter(a => a.id !== id) })}
            />
          </div>
        )}

        {/* METHODS TAB */}
        {activeTab === 'methods' && (!isEnum || advancedEnumMode) && (
          <div className="animate-in fade-in duration-200">
            <MethodsList
              methods={methods}
              attributes={attributes}
              isInterface={isInterface}
              onAdd={goToAddMethod}
              onEdit={goToEditMethod}
              onDelete={(id: string) => onChange({ ...node, methods: methods.filter(m => m.id !== id) })}
              onGenerateConstructor={(type: 'all' | 'empty') => {
                const matchName = node.name
                const newConstructor = buildConstructorMethod(matchName, attributes, type)
                
                let draftMethods = methods
                const existingIndex = methods.findIndex(m => m.name === matchName)
                if (existingIndex === -1) {
                  draftMethods = [...methods, newConstructor]
                } else {
                  const existing = methods[existingIndex]
                  const existingParams = Array.isArray(existing.parameters) ? existing.parameters : []
                  if (type === 'all' && existingParams.length === 0 && newConstructor.parameters.length > 0) {
                    const nextMethods = [...methods]
                    nextMethods[existingIndex] = {
                      ...existing,
                      parameters: newConstructor.parameters,
                      explicitlyEmpty: false
                    }
                    draftMethods = nextMethods
                  }
                }

                if (import.meta.env.DEV) {
                  console.log("[METHOD_GENERATE_EDITOR_DRAFT]", draftMethods)
                }

                onChange({
                  ...node,
                  methods: draftMethods
                })

                if (import.meta.env.DEV) {
                  console.log("[METHOD_GENERATE_NODE_DATA]", {
                    nodeId: node.id,
                    methods: draftMethods
                  })
                }
              }}
              onGenerateGettersSetters={(type: 'both' | 'get' | 'set') => {
                const newMethods = [...methods]
                attributes.forEach(attr => {
                  const generatedGetter = buildGetterMethod(attr)
                  const generatedSetter = buildSetterMethod(attr)

                  if (type === 'both' || type === 'get') {
                    const existingIndex = newMethods.findIndex(m => m.name === generatedGetter.name)
                    if (existingIndex === -1) {
                      newMethods.push(generatedGetter)
                    }
                  }
                  if (type === 'both' || type === 'set') {
                    const existingIndex = newMethods.findIndex(m => m.name === generatedSetter.name)
                    if (existingIndex === -1) {
                      newMethods.push(generatedSetter)
                    } else {
                      const existing = newMethods[existingIndex]
                      const existingParams = Array.isArray(existing.parameters) ? existing.parameters : []
                      if (existingParams.length === 0) {
                        newMethods[existingIndex] = {
                          ...existing,
                          parameters: generatedSetter.parameters,
                          returnType: 'void'
                        }
                      }
                    }
                  }
                })
                if (import.meta.env.DEV) {
                  console.log("[METHOD_GEN_GETTERS_SETTERS]", {
                    type,
                    newMethodsCount: newMethods.length,
                    methods: newMethods.map(m => ({
                      id: m.id,
                      name: m.name,
                      returnType: m.returnType,
                      parametersCount: Array.isArray(m.parameters) ? m.parameters.length : 0,
                      parameters: m.parameters
                    }))
                  })
                  console.log("[METHOD_GENERATE_EDITOR_DRAFT]", newMethods)
                }
                onChange({ ...node, methods: newMethods })
                if (import.meta.env.DEV) {
                  console.log("[METHOD_GENERATE_NODE_DATA]", {
                    nodeId: node.id,
                    methods: newMethods
                  })
                }
              }}
            />
          </div>
        )}

        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Color de Acento</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Neutral', value: 'neutral' },
                  { label: 'Gris', value: 'gris' },
                  { label: 'Azul', value: 'azul' },
                  { label: 'Verde', value: 'verde' },
                  { label: 'Dorado', value: 'dorado' },
                  { label: 'Violeta', value: 'violeta' },
                  { label: 'Rojo', value: 'rojo' },
                ].map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => onChange({
                      ...node,
                      style: {
                        ...node.style,
                        color: preset.value,
                      }
                    })}
                    className={`w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-800 transition-all ${node.style?.color === preset.value || (!node.style?.color && preset.value === 'neutral') ? 'ring-2 ring-blue-500 scale-110 shadow' : 'hover:scale-105'}`}
                    style={{
                      backgroundColor:
                        preset.value === 'neutral' ? '#f4f4f5' :
                        preset.value === 'gris' ? '#94a3b8' :
                        preset.value === 'azul' ? '#3b82f6' :
                        preset.value === 'verde' ? '#10b981' :
                        preset.value === 'dorado' ? '#eab308' :
                        preset.value === 'violeta' ? '#8b5cf6' : '#ef4444'
                    }}
                    title={preset.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-900 pt-3">
              <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!(node as any).compactMode}
                  onChange={(e) => onChange({ ...node, compactMode: e.target.checked } as any)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Modo Compacto</span>
                  <span className="text-[9px] text-zinc-400">Reduce márgenes internos de la tarjeta</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!(node as any).hideEmptySections}
                  onChange={(e) => onChange({ ...node, hideEmptySections: e.target.checked } as any)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Ocultar Secciones Vacías</span>
                  <span className="text-[9px] text-zinc-400">No muestra divisores sin atributos ni métodos</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!(node as any).hideVisibilitySymbols}
                  onChange={(e) => onChange({ ...node, hideVisibilitySymbols: !e.target.checked } as any)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Mostrar Símbolos de Visibilidad</span>
                  <span className="text-[9px] text-zinc-400">Visualiza +, -, # y ~ al inicio de campos</span>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getVisibilitySymbol(v: VisibilityType) {
  switch (v) {
    case 'public': return '+'
    case 'private': return '-'
    case 'protected': return '#'
    case 'package': return '~'
    default: return '+'
  }
}

// ── Sub-components for Attributes ──

function AttributesList({ attributes, onAdd, onEdit, onDelete }: any) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atributos</span>
        <Button size="sm" onClick={onAdd}>+ Agregar</Button>
      </div>

      <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
        {attributes.map((a: any) => (
          <div key={a.id} className="p-2 bg-zinc-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-700/60 rounded-xl flex items-center justify-between group">
            <div className="flex flex-col truncate pr-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-blue-500 font-mono font-bold">{getVisibilitySymbol(a.visibility)}</span>
                <span className={`font-bold text-slate-700 dark:text-slate-200 truncate ${a.static ? 'underline font-bold' : ''}`}>{a.name}</span>
                <span className="text-slate-400 dark:text-slate-500 truncate">: {a.type}</span>
              </div>
              <div className="flex gap-2.5 mt-0.5">
                {a.required && <span className="text-[8px] text-rose-500 font-bold uppercase tracking-tighter">Requerido</span>}
                {a.final && <span className="text-[8px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-tighter">Final</span>}
                {a.static && <span className="text-[8px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-tighter">Static</span>}
              </div>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => onEdit(a.id)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-blue-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2.5} /></svg></button>
              <button onClick={() => onDelete(a.id)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-rose-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" strokeWidth={2.5} /></svg></button>
            </div>
          </div>
        ))}
        {attributes.length === 0 && (
          <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs italic">
            Sin atributos definidos
          </div>
        )}
      </div>
    </div>
  )
}

function AttributeForm({ attribute, availableEnums, onBack, onSave }: any) {
  const [data, setData] = useState<DiagramClassAttributeDTO>(attribute || {
    id: '',
    name: '',
    type: 'String',
    visibility: 'private',
    required: false,
    static: false,
    final: false,
  })

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      <header className="flex items-center gap-2 mb-2">
        <button onClick={onBack} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth={2.5} /></svg>
        </button>
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">{attribute ? 'Editar Atributo' : 'Nuevo Atributo'}</h3>
      </header>
      
      <div className="space-y-3">
        <Input label="Nombre" value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="ej. email" autoFocus maxLength={50} />
        
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Visibilidad</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['public', 'private', 'protected', 'package'] as VisibilityType[]).map(v => (
              <button
                key={v}
                onClick={() => setData({...data, visibility: v})}
                className={`py-1.5 text-xs font-black rounded-lg border transition-all ${data.visibility === v ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
              >
                {getVisibilitySymbol(v)}
              </button>
            ))}
          </div>
        </div>

        <DataTypeSelector value={data.type} enums={availableEnums} onChange={val => setData({...data, type: val})} />

        <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-900 pt-3">
          <label className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer select-none">
            <input type="checkbox" checked={data.required} onChange={e => setData({...data, required: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Requerido</span>
              <span className="text-[9px] text-slate-400">Atributo obligatorio (no nulo)</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer select-none">
            <input type="checkbox" checked={!!data.static} onChange={e => setData({...data, static: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Static</span>
              <span className="text-[9px] text-slate-400">Subrayado en el diagrama UML</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer select-none">
            <input type="checkbox" checked={!!data.final} onChange={e => setData({...data, final: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Final / Constante</span>
              <span className="text-[9px] text-slate-400">Atributo inmutable</span>
            </div>
          </label>
        </div>
      </div>

      <div className="pt-2 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onBack}>Cancelar</Button>
        <Button variant="primary" className="flex-1" onClick={() => onSave(data)} disabled={!data.name.trim()}>Guardar</Button>
      </div>
    </div>
  )
}

// ── Sub-components for Methods ──

function renderParams(params: any): string {
  if (Array.isArray(params)) {
    return params.map(p => `${p.name}: ${p.type}`).join(', ')
  }
  return typeof params === 'string' ? params : ''
}

function MethodsList({ methods, attributes, isInterface, onAdd, onEdit, onDelete, onGenerateConstructor, onGenerateGettersSetters }: any) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Métodos</span>
        <Button size="sm" onClick={onAdd}>+ Agregar</Button>
      </div>

      {!isInterface && attributes.length > 0 && (
        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl space-y-1.5">
          <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">Generación automática</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={() => onGenerateConstructor('all')} className="py-1 px-1.5 bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-800 rounded-lg text-[9px] font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all">Constructor (Campos)</button>
            <button onClick={() => onGenerateConstructor('empty')} className="py-1 px-1.5 bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-800 rounded-lg text-[9px] font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all">Constructor (Vacío)</button>
            <button onClick={() => onGenerateGettersSetters('get')} className="py-1 px-1.5 bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-800 rounded-lg text-[9px] font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all">Getters</button>
            <button onClick={() => onGenerateGettersSetters('set')} className="py-1 px-1.5 bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-800 rounded-lg text-[9px] font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all">Setters</button>
            <button onClick={() => onGenerateGettersSetters('both')} className="col-span-2 py-1 bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-800 rounded-lg text-[9px] font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all">Getters & Setters</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
        {methods.map((m: any) => (
          <div key={m.id} className="p-2 bg-zinc-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-700/60 rounded-xl flex items-center justify-between group">
            <div className="flex flex-col truncate pr-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-emerald-500 font-mono font-bold">{getVisibilitySymbol(m.visibility)}</span>
                <span className={`font-bold text-slate-700 dark:text-slate-200 truncate ${m.static ? 'underline font-bold' : ''} ${m.abstract ? 'italic' : ''}`}>{m.name}({renderParams(m.parameters)})</span>
              </div>
              <span className="text-[10px] text-slate-400 truncate ml-3">Retorno: {m.returnType || 'void'}</span>
              <div className="flex gap-2.5 mt-0.5 ml-3">
                {m.static && <span className="text-[8px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-tighter">Static</span>}
                {m.abstract && <span className="text-[8px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-tighter">Abstract</span>}
              </div>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => onEdit(m.id)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-blue-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2.5} /></svg></button>
              <button onClick={() => onDelete(m.id)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-rose-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" strokeWidth={2.5} /></svg></button>
            </div>
          </div>
        ))}
        {methods.length === 0 && (
          <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs italic">
            Sin métodos definidos
          </div>
        )}
      </div>
    </div>
  )
}

function MethodForm({ method, availableEnums, onBack, onSave }: any) {
  const [data, setData] = useState<any>(() => {
    const rawParams = method?.parameters ?? method?.params ?? method?.arguments
    let initialParamStr = ''
    if (typeof rawParams === 'string') {
      initialParamStr = rawParams
    } else if (Array.isArray(rawParams)) {
      initialParamStr = rawParams.map((p: any) => `${p.name}: ${p.type || 'String'}`).join(', ')
    }
    return {
      id: method?.id || '',
      name: method?.name || '',
      paramStr: initialParamStr,
      returnType: method?.returnType || 'void',
      visibility: method?.visibility || 'public',
      static: method?.static || false,
      abstract: method?.abstract || false,
    }
  })

  const handleSave = () => {
    const parsedParams = data.paramStr.split(',').map((part: string) => {
      const parts = part.trim().split(':')
      const pName = parts[0]?.trim() || ''
      const pType = parts[1]?.trim() || 'String'
      return {
        id: generateSafeId(),
        name: pName,
        type: pType
      }
    }).filter((p: any) => p.name.length > 0)

    onSave({
      id: data.id || generateSafeId(),
      name: data.name,
      parameters: parsedParams,
      returnType: data.returnType,
      visibility: data.visibility,
      static: data.static,
      abstract: data.abstract
    })
  }

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      <header className="flex items-center gap-2 mb-2">
        <button onClick={onBack} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth={2.5} /></svg>
        </button>
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">{method ? 'Editar Método' : 'Nuevo Método'}</h3>
      </header>
      
      <div className="space-y-3">
        <Input label="Nombre" value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="ej. login" autoFocus maxLength={50} />
        
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Visibilidad</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['public', 'private', 'protected', 'package'] as VisibilityType[]).map(v => (
              <button
                key={v}
                onClick={() => setData({...data, visibility: v})}
                className={`py-1.5 text-xs font-black rounded-lg border transition-all ${data.visibility === v ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
              >
                {getVisibilitySymbol(v)}
              </button>
            ))}
          </div>
        </div>

        <Input label="Parámetros" value={data.paramStr} onChange={e => setData({...data, paramStr: e.target.value})} placeholder="ej. email: String, key: UUID" maxLength={150} />
        
        <DataTypeSelector label="Retorno" value={data.returnType} enums={availableEnums} onChange={val => setData({...data, returnType: val})} />

        <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-900 pt-3">
          <label className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer select-none">
            <input type="checkbox" checked={!!data.static} onChange={e => setData({...data, static: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Static</span>
              <span className="text-[9px] text-slate-400">Subrayado en el diagrama UML</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer select-none">
            <input type="checkbox" checked={!!data.abstract} onChange={e => setData({...data, abstract: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Abstract</span>
              <span className="text-[9px] text-slate-400">Cursiva en el diagrama UML</span>
            </div>
          </label>
        </div>
      </div>

      <div className="pt-2 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onBack}>Cancelar</Button>
        <Button variant="primary" className="flex-1" onClick={handleSave} disabled={!data.name.trim()}>Guardar</Button>
      </div>
    </div>
  )
}

// ── Sub-components for Enums ──

function EnumValuesPanel({ values, onAdd, onChange }: any) {
  const update = (id: string, name: string) => onChange(values.map((v: any) => v.id === id ? { ...v, name: name.toUpperCase() } : v))
  const remove = (id: string) => onChange(values.filter((v: any) => v.id !== id))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valores Enum</span>
        <Button size="sm" onClick={onAdd}>+ Agregar</Button>
      </div>

      <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
        {values.map((v: any) => (
          <div key={v.id} className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-150 dark:border-slate-700/60 bg-zinc-50 dark:bg-slate-800/40 group transition-all focus-within:border-blue-500">
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 p-0.5 text-xs font-mono font-bold uppercase placeholder:opacity-50 text-slate-700 dark:text-slate-200 outline-none"
              maxLength={100}
              value={v.name}
              onChange={(e) => update(v.id, e.target.value)}
              placeholder="VALOR_ENUM"
              autoFocus
            />
            <button onClick={() => remove(v.id)} className="p-1 text-slate-355 hover:text-rose-500 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5} /></svg>
            </button>
          </div>
        ))}
        {values.length === 0 && (
          <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs italic">
            Sin valores definidos
          </div>
        )}
      </div>
    </div>
  )
}

// ── Shared Data Type Selector ──

function DataTypeSelector({ value, enums, onChange, label = 'Tipo de dato' }: { value: string, enums: string[], onChange: (val: string) => void, label?: string }) {
  const commonTypes = ['String', 'int', 'long', 'double', 'boolean', 'Date', 'LocalDate', 'UUID', 'void', 'List<T>']
  const [isManual, setIsManual] = useState(!commonTypes.includes(value) && !enums.includes(value))

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{label}</label>
      <div className="flex flex-wrap gap-1">
        {commonTypes.map(t => (
          <button
            key={t}
            onClick={() => { onChange(t); setIsManual(false); }}
            className={`px-2 py-0.5 rounded border text-[10px] font-bold transition-all ${value === t ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300'}`}
          >
            {t}
          </button>
        ))}
        {enums.map(e => (
          <button
            key={e}
            onClick={() => { onChange(e); setIsManual(false); }}
            className={`px-2 py-0.5 rounded border text-[10px] font-bold transition-all bg-amber-50 dark:bg-amber-900/20 border-amber-250 text-amber-700 dark:text-amber-400 ${value === e ? 'ring-1 ring-amber-500' : ''}`}
          >
            {e}
          </button>
        ))}
        <button
          onClick={() => setIsManual(true)}
          className={`px-2 py-0.5 rounded border text-[10px] font-bold transition-all ${isManual ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 text-blue-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
        >
          Otro...
        </button>
      </div>
      {isManual && (
        <input
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none animate-in zoom-in-95 duration-200"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ej. MiClase, Map<String, Object>"
          autoFocus
          maxLength={30}
        />
      )}
    </div>
  )
}
