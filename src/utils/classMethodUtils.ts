import { generateSafeId } from './diagramMapper'
import type { DiagramClassAttributeDTO, DiagramClassMethodDTO } from '../types/diagrams'

/**
 * Standardized automatic constructor generator.
 */
export function buildConstructorMethod(
  className: string,
  attributes: DiagramClassAttributeDTO[],
  mode: 'all' | 'empty'
): DiagramClassMethodDTO {
  const parameters = mode === 'all'
    ? attributes.map(a => ({
        id: generateSafeId(),
        name: a.name,
        type: a.type || 'String'
      }))
    : []

  return {
    id: generateSafeId(),
    visibility: 'public',
    name: className,
    returnType: '',
    parameters,
    static: false,
    isStatic: false,
    abstract: false,
    isAbstract: false,
    explicitlyEmpty: mode === 'empty',
    constructorKind: mode === 'all' ? 'ALL_FIELDS' : 'EMPTY'
  } as any
}

/**
 * Standardized automatic getter generator.
 */
export function buildGetterMethod(attribute: DiagramClassAttributeDTO): DiagramClassMethodDTO {
  const name = attribute.name
  const typeStr = attribute.type || 'String'
  const cap = name.charAt(0).toUpperCase() + name.slice(1)
  const isBool = typeStr.toLowerCase() === 'boolean'
  
  let getterName = `get${cap}`
  if (isBool) {
    if (name.startsWith('is') && name.length > 2 && name.charAt(2) === name.charAt(2).toUpperCase()) {
      getterName = name
    } else {
      getterName = `is${cap}`
    }
  }

  return {
    id: generateSafeId(),
    visibility: 'public',
    name: getterName,
    returnType: typeStr,
    parameters: [],
    static: false,
    isStatic: false,
    abstract: false,
    isAbstract: false
  }
}

/**
 * Standardized automatic setter generator.
 */
export function buildSetterMethod(attribute: DiagramClassAttributeDTO): DiagramClassMethodDTO {
  const name = attribute.name
  const typeStr = attribute.type || 'String'
  const cap = name.charAt(0).toUpperCase() + name.slice(1)
  const setterName = `set${cap}`

  return {
    id: generateSafeId(),
    visibility: 'public',
    name: setterName,
    returnType: 'void',
    parameters: [
      {
        id: generateSafeId(),
        name: name,
        type: typeStr
      }
    ],
    static: false,
    isStatic: false,
    abstract: false,
    isAbstract: false
  }
}
