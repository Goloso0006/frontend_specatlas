import { useState, useEffect } from 'react'
import type {
  DiagramClassAttributeDTO,
  DiagramClassMethodDTO,
  DiagramClassNodeDTO,
  DiagramNodeDTO,
  VisibilityType
} from '../../types/diagrams'
import { generateSafeId } from '../../utils/diagramMapper'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

type EditorView = 'MAIN' | 'BASIC_INFO' | 'ATTRIBUTES_LIST' | 'ATTRIBUTE_FORM' | 'METHODS_LIST' | 'METHOD_FORM' | 'ENUM_VALUES'

interface ClassNodeEditorProps {
  node: DiagramClassNodeDTO
  nodes: DiagramNodeDTO[]
  onChange: (node: DiagramClassNodeDTO) => void
  onSubScreenChange?: (isSubScreen: boolean) => void
}

export function ClassNodeEditor({ node, nodes, onChange, onSubScreenChange }: ClassNodeEditorProps) {
  const [view, setView] = useState<EditorView>('MAIN')
  const [selectedAttrId, setSelectedAttrId] = useState<string | null>(null)
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null)

  useEffect(() => {
    if (onSubScreenChange) {
      onSubScreenChange(view !== 'MAIN')
    }
  }, [view, onSubScreenChange])

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
  const goToMain = () => setView('MAIN')
  const goToAddAttribute = () => { setSelectedAttrId(null); setView('ATTRIBUTE_FORM'); }
  const goToEditAttribute = (id: string) => { setSelectedAttrId(id); setView('ATTRIBUTE_FORM'); }
  const goToAddMethod = () => { setSelectedMethodId(null); setView('METHOD_FORM'); }
  const goToEditMethod = (id: string) => { setSelectedMethodId(id); setView('METHOD_FORM'); }

  // ── Rendering based on view ──
  switch (view) {
    case 'ATTRIBUTES_LIST':
      return (
        <AttributesList
          attributes={attributes}
          onBack={goToMain}
          onAdd={goToAddAttribute}
          onEdit={goToEditAttribute}
           onDelete={(id: string) => onChange({ ...node, attributes: attributes.filter(a => a.id !== id) })}
        />
      )
    case 'ATTRIBUTE_FORM':
      return (
        <AttributeForm
          attribute={attributes.find(a => a.id === selectedAttrId)}
          availableEnums={availableEnums}
          onBack={() => setView('ATTRIBUTES_LIST')}
          onSave={(attr: DiagramClassAttributeDTO) => {
            const nextAttrs = selectedAttrId 
              ? attributes.map(a => a.id === selectedAttrId ? attr : a)
              : [...attributes, { ...attr, id: generateSafeId() }]
            onChange({ ...node, attributes: nextAttrs })
            setView('ATTRIBUTES_LIST')
          }}
        />
      )
    case 'METHODS_LIST':
      return (
        <MethodsList
          methods={methods}
          attributes={attributes}
          onBack={goToMain}
          onAdd={goToAddMethod}
          onEdit={goToEditMethod}
          onDelete={(id: string) => onChange({ ...node, methods: methods.filter(m => m.id !== id) })}
          onGenerateConstructor={() => {
            const params = attributes.map(a => `${a.name}: ${a.type}`).join(', ')
            if (!methods.some(m => m.name === node.name)) {
              onChange({ ...node, methods: [...methods, { id: generateSafeId(), name: node.name, parameters: params, returnType: '', visibility: 'public' }] })
            }
          }}
          onGenerateGettersSetters={(type: 'both' | 'get' | 'set') => {
            const newMethods = [...methods]
            attributes.forEach(attr => {
              const cap = attr.name.charAt(0).toUpperCase() + attr.name.slice(1)
              if ((type === 'both' || type === 'get') && !newMethods.some(m => m.name === `get${cap}`)) {
                newMethods.push({ id: generateSafeId(), name: `get${cap}`, parameters: '', returnType: attr.type, visibility: 'public' })
              }
              if ((type === 'both' || type === 'set') && !newMethods.some(m => m.name === `set${cap}`)) {
                newMethods.push({ id: generateSafeId(), name: `set${cap}`, parameters: `${attr.name}: ${attr.type}`, returnType: 'void', visibility: 'public' })
              }
            })
            onChange({ ...node, methods: newMethods })
          }}
        />
      )
    case 'METHOD_FORM':
      return (
        <MethodForm
          method={methods.find(m => m.id === selectedMethodId)}
          availableEnums={availableEnums}
          onBack={() => setView('METHODS_LIST')}
          onSave={(method: DiagramClassMethodDTO) => {
            const nextMethods = selectedMethodId 
              ? methods.map(m => m.id === selectedMethodId ? method : m)
              : [...methods, { ...method, id: generateSafeId() }]
            onChange({ ...node, methods: nextMethods })
            setView('METHODS_LIST')
          }}
        />
      )
    case 'ENUM_VALUES':
      return (
        <EnumValuesPanel
          values={enumValues}
          onBack={goToMain}
          onChange={(vals: typeof enumValues) => onChange({ ...node, enumValues: vals })}
        />
      )
    case 'BASIC_INFO':
      return (
        <BasicInfoForm
          name={node.name}
          umlType={umlType}
          onBack={goToMain}
          onSave={(name: string) => {
            onChange({ ...node, name })
            goToMain()
          }}
        />
      )
    default:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <header className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{node.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                {umlType === 'ABSTRACT_CLASS' ? 'Abstract' : isInterface ? 'Interface' : isEnum ? 'Enum' : 'Class'}
              </span>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-3">
            <NavButton 
              label="Información Básica" 
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              onClick={() => setView('BASIC_INFO')} 
            />
            
            {!isEnum && (
              <>
                <NavButton 
                  label={`Atributos (${attributes.length})`} 
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7" /></svg>}
                  onClick={() => setView('ATTRIBUTES_LIST')} 
                />
                <NavButton 
                  label={`Métodos (${methods.length})`} 
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 9l3 3-3 3m5 0h3" /></svg>}
                  onClick={() => setView('METHODS_LIST')} 
                />
              </>
            )}

            {isEnum && (
              <NavButton 
                label={`Valores (${enumValues.length})`} 
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7" /></svg>}
                onClick={() => setView('ENUM_VALUES')} 
              />
            )}
          </div>
        </div>
      )
  }
}

// ── Shared Components ──

function NavButton({ label, icon, onClick }: { label: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 flex items-center justify-between bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all group text-left"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-blue-500 transition-colors">
          {icon}
        </div>
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
      </div>
      <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-all transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

function BackButton({ onClick, label = 'Volver' }: { onClick: () => void, label?: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors mb-4">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth={2.5} /></svg>
      {label}
    </button>
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

// ── Sub-panels ──

function AttributesList({ attributes, onBack, onAdd, onEdit, onDelete }: any) {
  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      <BackButton onClick={onBack} />
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Atributos</h3>
        <Button size="sm" onClick={onAdd}>+ Agregar</Button>
      </div>
      <div className="space-y-2">
        {attributes.map((a: any) => (
          <div key={a.id} className="p-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between group">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-blue-500 font-mono font-bold">{getVisibilitySymbol(a.visibility)}</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{a.name}</span>
                <span className="text-xs text-slate-400">: {a.type}</span>
              </div>
              {a.required && <span className="text-[9px] text-rose-500 font-bold uppercase tracking-tighter">Requerido</span>}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(a.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-blue-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2} /></svg></button>
              <button onClick={() => onDelete(a.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-rose-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" strokeWidth={2} /></svg></button>
            </div>
          </div>
        ))}
        {attributes.length === 0 && (
          <div className="p-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 text-xs italic">
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
    required: false
  })

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <BackButton onClick={onBack} label="Lista de atributos" />
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{attribute ? 'Editar Atributo' : 'Nuevo Atributo'}</h3>
      
      <div className="space-y-4">
        <Input label="Nombre" value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="ej. email" autoFocus />
        
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Visibilidad</label>
          <div className="grid grid-cols-4 gap-2">
            {(['public', 'private', 'protected', 'package'] as VisibilityType[]).map(v => (
              <button
                key={v}
                onClick={() => setData({...data, visibility: v})}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${data.visibility === v ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
              >
                {getVisibilitySymbol(v)}
              </button>
            ))}
          </div>
        </div>

        <DataTypeSelector value={data.type} enums={availableEnums} onChange={val => setData({...data, type: val})} />

        <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer group">
          <input type="checkbox" checked={data.required} onChange={e => setData({...data, required: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Requerido</span>
            <span className="text-[10px] text-slate-400">Marcar si el atributo no puede ser nulo</span>
          </div>
        </label>
      </div>

      <div className="pt-4 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onBack}>Cancelar</Button>
        <Button variant="primary" className="flex-1" onClick={() => onSave(data)} disabled={!data.name.trim()}>Guardar</Button>
      </div>
    </div>
  )
}

function MethodsList({ methods, attributes, onBack, onAdd, onEdit, onDelete, onGenerateConstructor, onGenerateGettersSetters }: any) {
  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      <BackButton onClick={onBack} />
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Métodos</h3>
        <Button size="sm" onClick={onAdd}>+ Agregar</Button>
      </div>

      {attributes.length > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-2xl space-y-2">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">Generación rápida</span>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onGenerateConstructor} className="py-1.5 px-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all">Constructor</button>
            <button onClick={() => onGenerateGettersSetters('both')} className="py-1.5 px-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all">Get & Set</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {methods.map((m: any) => (
          <div key={m.id} className="p-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between group">
            <div className="flex flex-col truncate pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-mono font-bold">{getVisibilitySymbol(m.visibility)}</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{m.name}()</span>
              </div>
              <span className="text-[10px] text-slate-400 truncate">: {m.returnType || 'void'}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => onEdit(m.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-blue-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2} /></svg></button>
              <button onClick={() => onDelete(m.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-rose-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" strokeWidth={2} /></svg></button>
            </div>
          </div>
        ))}
        {methods.length === 0 && (
          <div className="p-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 text-xs italic">
            Sin métodos definidos
          </div>
        )}
      </div>
    </div>
  )
}

function MethodForm({ method, availableEnums, onBack, onSave }: any) {
  const [data, setData] = useState<DiagramClassMethodDTO>(method || {
    id: '',
    name: '',
    parameters: '',
    returnType: 'void',
    visibility: 'public'
  })

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <BackButton onClick={onBack} label="Lista de métodos" />
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{method ? 'Editar Método' : 'Nuevo Método'}</h3>
      
      <div className="space-y-4">
        <Input label="Nombre" value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="ej. login" autoFocus />
        
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Visibilidad</label>
          <div className="grid grid-cols-4 gap-2">
            {(['public', 'private', 'protected', 'package'] as VisibilityType[]).map(v => (
              <button
                key={v}
                onClick={() => setData({...data, visibility: v})}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${data.visibility === v ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
              >
                {getVisibilitySymbol(v)}
              </button>
            ))}
          </div>
        </div>

        <Input label="Parámetros" value={data.parameters} onChange={e => setData({...data, parameters: e.target.value})} placeholder="ej. email: string, pass: string" />
        
        <DataTypeSelector label="Retorno" value={data.returnType} enums={availableEnums} onChange={val => setData({...data, returnType: val})} />
      </div>

      <div className="pt-4 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onBack}>Cancelar</Button>
        <Button variant="primary" className="flex-1" onClick={() => onSave(data)} disabled={!data.name.trim()}>Guardar</Button>
      </div>
    </div>
  )
}

function BasicInfoForm({ name, umlType, onBack, onSave }: any) {
  const [val, setVal] = useState(name)
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <BackButton onClick={onBack} />
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Información básica</h3>
      <div className="space-y-4">
        <Input label="Nombre de la clase" value={val} onChange={e => setVal(e.target.value)} autoFocus />
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Tipo actual</span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{umlType}</span>
          <p className="text-[10px] text-slate-400 mt-1 italic">El tipo se define al crear el elemento. No puede cambiarse para preservar integridad.</p>
        </div>
      </div>
      <div className="pt-4 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onBack}>Cancelar</Button>
        <Button variant="primary" className="flex-1" onClick={() => onSave(val)} disabled={!val.trim()}>Guardar</Button>
      </div>
    </div>
  )
}

function EnumValuesPanel({ values, onBack, onChange }: any) {
  const add = () => {
    const nextVal = values.length + 1
    onChange([...values, { id: generateSafeId(), name: `VALOR_${nextVal}` }])
  }
  const update = (id: string, name: string) => onChange(values.map((v: any) => v.id === id ? { ...v, name: name.toUpperCase() } : v))
  const remove = (id: string) => onChange(values.filter((v: any) => v.id !== id))

  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      <BackButton onClick={onBack} />
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Valores Enum</h3>
        <Button size="sm" onClick={add}>+ Agregar</Button>
      </div>
      <div className="space-y-2">
        {values.map((v: any) => (
          <div key={v.id} className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 group transition-all focus-within:border-blue-500">
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 p-1 text-xs font-mono font-bold uppercase placeholder:opacity-50 text-slate-700 dark:text-slate-200"
              value={v.name}
              onChange={(e) => update(v.id, e.target.value)}
              placeholder="VALOR_ENUM"
              autoFocus
            />
            <button onClick={() => remove(v.id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function DataTypeSelector({ value, enums, onChange, label = 'Tipo de dato' }: { value: string, enums: string[], onChange: (val: string) => void, label?: string }) {
  const commonTypes = ['String', 'int', 'long', 'double', 'boolean', 'Date', 'LocalDate', 'UUID', 'void', 'List<T>']
  const [isManual, setIsManual] = useState(!commonTypes.includes(value) && !enums.includes(value))

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {commonTypes.map(t => (
          <button
            key={t}
            onClick={() => { onChange(t); setIsManual(false); }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${value === t ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300'}`}
          >
            {t}
          </button>
        ))}
        {enums.map(e => (
          <button
            key={e}
            onClick={() => { onChange(e); setIsManual(false); }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 ${value === e ? 'ring-2 ring-amber-500' : ''}`}
          >
            {e}
          </button>
        ))}
        <button
          onClick={() => setIsManual(true)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${isManual ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
        >
          Otro...
        </button>
      </div>
      {isManual && (
        <input
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none animate-in zoom-in-95 duration-200"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ej. MiClase, Map<String, Object>"
          autoFocus
        />
      )}
    </div>
  )
}
