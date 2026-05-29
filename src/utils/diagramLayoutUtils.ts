import type { Node, Edge } from '@xyflow/react'
import type { DiagramNodeDTO, DiagramRelationDTO, DiagramType } from '../types/diagrams'

/**
 * Automatically arranges class and use case diagrams for optimal visual hierarchy,
 * spacing, and containment.
 */
export function autoLayoutDiagram(
  nodes: Node<DiagramNodeDTO>[],
  edges: Edge<DiagramRelationDTO>[],
  diagramType: DiagramType
): Node<DiagramNodeDTO>[] {
  if (nodes.length === 0) return nodes

  // Deep copy nodes to avoid direct mutation
  const nextNodes = nodes.map(n => ({
    ...n,
    position: { ...n.position },
    data: n.data ? { ...n.data, position: { ...(n.data.position || n.position) } } : n.data
  }))

  if (diagramType === 'USE_CASE') {
    // ── USE CASE AUTO-LAYOUT ──
    const actors = nextNodes.filter(n => n.type === 'actorNode' || n.data?.kind === 'actor')
    const useCases = nextNodes.filter(n => n.type === 'useCaseNode' || n.data?.kind === 'useCase')
    const packages = nextNodes.filter(n => n.type === 'packageNode')

    // Separate primary vs secondary actors
    const primaryActors: typeof actors = []
    const secondaryActors: typeof actors = []

    actors.forEach(actor => {
      const actorKind = (actor.data as any).actorType || (actor.data as any).kind || 'primary'
      if (actorKind === 'secondary') {
        secondaryActors.push(actor)
      } else {
        primaryActors.push(actor)
      }
    })

    // Create a mapping of use cases to their connected actors
    const useCaseActorRelations = new Map<string, { primary: boolean, secondary: boolean }>()
    useCases.forEach(uc => useCaseActorRelations.set(uc.id, { primary: false, secondary: false }))

    edges.forEach(edge => {
      const isPrimarySource = primaryActors.some(a => a.id === edge.source)
      const isPrimaryTarget = primaryActors.some(a => a.id === edge.target)
      const isSecondarySource = secondaryActors.some(a => a.id === edge.source)
      const isSecondaryTarget = secondaryActors.some(a => a.id === edge.target)

      if (isPrimarySource && useCaseActorRelations.has(edge.target)) useCaseActorRelations.get(edge.target)!.primary = true
      if (isPrimaryTarget && useCaseActorRelations.has(edge.source)) useCaseActorRelations.get(edge.source)!.primary = true
      if (isSecondarySource && useCaseActorRelations.has(edge.target)) useCaseActorRelations.get(edge.target)!.secondary = true
      if (isSecondaryTarget && useCaseActorRelations.has(edge.source)) useCaseActorRelations.get(edge.source)!.secondary = true
    })

    // Group use cases based on their relations
    const primaryUseCases = useCases.filter(uc => useCaseActorRelations.get(uc.id)!.primary && !useCaseActorRelations.get(uc.id)!.secondary)
    const sharedUseCases = useCases.filter(uc => useCaseActorRelations.get(uc.id)!.primary && useCaseActorRelations.get(uc.id)!.secondary)
    const secondaryUseCases = useCases.filter(uc => !useCaseActorRelations.get(uc.id)!.primary && useCaseActorRelations.get(uc.id)!.secondary)
    const isolatedUseCases = useCases.filter(uc => !useCaseActorRelations.get(uc.id)!.primary && !useCaseActorRelations.get(uc.id)!.secondary)

    const orderedUseCases = [...primaryUseCases, ...sharedUseCases, ...secondaryUseCases, ...isolatedUseCases]

    const cols = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(orderedUseCases.length))))
    const spacingY = 300
    const actorXLeft = 80
    const useCaseStartX = 420
    const useCaseSpacingX = 420
    const useCaseSpacingY = 250
    const actorXRight = useCaseStartX + cols * useCaseSpacingX + 120

    // 1. Layout primary actors on the left
    primaryActors.forEach((actor, index) => {
      actor.position = { x: actorXLeft, y: index * spacingY + 100 }
      if (actor.data) actor.data.position = { ...actor.position }
    })

    // 2. Layout secondary actors on the right
    secondaryActors.forEach((actor, index) => {
      actor.position = { x: actorXRight, y: index * spacingY + 100 }
      if (actor.data) actor.data.position = { ...actor.position }
    })

    // 3. Layout Use Cases in a grid
    orderedUseCases.forEach((uc, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      uc.position = {
        x: useCaseStartX + col * useCaseSpacingX,
        y: row * useCaseSpacingY + 80
      }
      if (uc.data) uc.data.position = { ...uc.position }
    })

    // 4. Wrap all use cases with System package boundaries
    if (packages.length > 0) {
      packages.forEach((pkg) => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        useCases.forEach(uc => {
          minX = Math.min(minX, uc.position.x)
          minY = Math.min(minY, uc.position.y)
          maxX = Math.max(maxX, uc.position.x + 220)
          maxY = Math.max(maxY, uc.position.y + 120)
        })

        if (minX === Infinity) {
          minX = useCaseStartX - 60
          minY = 40
          maxX = useCaseStartX + 300
          maxY = 400
        } else {
          minX -= 80
          minY -= 80
          maxX += 80
          maxY += 80
        }

        pkg.position = { x: minX, y: minY }
        const pkgData = pkg.data as any
        if (pkgData) {
          pkgData.position = { ...pkg.position }
          pkgData.style = {
            ...pkgData.style,
            width: maxX - minX,
            height: maxY - minY
          }
        }
        pkg.style = {
          ...pkg.style,
          width: maxX - minX,
          height: maxY - minY
        }
      })
    }

  } else {
    // ── CLASS DIAGRAM AUTO-LAYOUT ──
    const packages = nextNodes.filter(n => n.type === 'packageNode')
    const standaloneNodes = nextNodes.filter(n => n.type !== 'packageNode' && !(n.data as any).packageId)

    // Build dependency graph
    const dependencies = new Map<string, string[]>()
    const incomingCounts = new Map<string, number>()
    
    // Initialize
    nextNodes.forEach(n => {
      if (n.type !== 'packageNode') {
        dependencies.set(n.id, [])
        incomingCounts.set(n.id, 0)
      }
    })

    // Populate dependencies based on edges (Generalization, Realization, Dependency point upwards)
    edges.forEach(edge => {
      const type = (edge.data as any)?.relationshipType || edge.type
      if (type === 'GENERALIZATION' || type === 'REALIZATION' || type === 'DEPENDENCY') {
        // source depends on target (target should be higher)
        if (dependencies.has(edge.target) && dependencies.has(edge.source)) {
          dependencies.get(edge.target)!.push(edge.source)
          incomingCounts.set(edge.source, incomingCounts.get(edge.source)! + 1)
        }
      } else if (type === 'ASSOCIATION' || type === 'AGGREGATION' || type === 'COMPOSITION') {
         // for others, treat as target depending on source slightly
         if (dependencies.has(edge.source) && dependencies.has(edge.target)) {
          dependencies.get(edge.source)!.push(edge.target)
          incomingCounts.set(edge.target, incomingCounts.get(edge.target)! + 1)
        }
      }
    })

    // Assign levels using topological sort like approach
    const levels = new Map<string, number>()
    const queue: { id: string, level: number }[] = []

    // Start with nodes having 0 incoming edges (Base classes)
    incomingCounts.forEach((count, id) => {
      if (count === 0) queue.push({ id, level: 0 })
    })

    // Break cycles if queue is empty but nodes remain
    if (queue.length === 0 && incomingCounts.size > 0) {
       queue.push({ id: Array.from(incomingCounts.keys())[0], level: 0 })
    }

    let maxLevel = 0
    while (queue.length > 0) {
      const { id, level } = queue.shift()!
      if (!levels.has(id) || levels.get(id)! < level) {
         levels.set(id, level)
         maxLevel = Math.max(maxLevel, level)
         const children = dependencies.get(id) || []
         children.forEach(child => {
            queue.push({ id: child, level: level + 1 })
         })
      }
    }

    // Assign remaining nodes to level maxLevel+1
    incomingCounts.forEach((_, id) => {
      if (!levels.has(id)) {
        levels.set(id, maxLevel + 1)
      }
    })

    const spacingX = 450
    const spacingY = 400
    let currentPkgX = 50
    let currentPkgY = 80

    // 1. Position packaged child classes inside their packages
    packages.forEach(pkg => {
      const children = nextNodes.filter(n => (n.data as any).packageId === pkg.id)
      
      pkg.position = { x: currentPkgX, y: currentPkgY }
      if (pkg.data) pkg.data.position = { ...pkg.position }

      if (children.length > 0) {
        // Group children by level
        const childrenByLevel = new Map<number, typeof children>()
        children.forEach(child => {
           const lvl = levels.get(child.id) || 0
           if (!childrenByLevel.has(lvl)) childrenByLevel.set(lvl, [])
           childrenByLevel.get(lvl)!.push(child)
        })

        const sortedLevels = Array.from(childrenByLevel.keys()).sort((a, b) => a - b)
        
        let maxCols = 0
        sortedLevels.forEach((lvl, rowIdx) => {
           const levelChildren = childrenByLevel.get(lvl)!
           maxCols = Math.max(maxCols, levelChildren.length)
           
           levelChildren.forEach((child, colIdx) => {
              // Center align nodes in a row
              const offsetX = (maxCols - levelChildren.length) * spacingX / 2
              const relX = 40 + offsetX + colIdx * spacingX
              const relY = 80 + rowIdx * spacingY
              child.position = {
                x: pkg.position.x + relX,
                y: pkg.position.y + relY
              }
              if (child.data) child.data.position = { ...child.position }
           })
        })

        const pkgW = maxCols * spacingX + 60
        const pkgH = sortedLevels.length * spacingY + 110

        const pkgData = pkg.data as any
        if (pkgData) {
          pkgData.style = {
            ...pkgData.style,
            width: pkgW,
            height: pkgH
          }
        }
        pkg.style = {
          ...pkg.style,
          width: pkgW,
          height: pkgH
        }

        currentPkgX += pkgW + 100
      } else {
        const pkgW = 320
        const pkgH = 240
        const pkgData = pkg.data as any
        if (pkgData) {
          pkgData.style = { ...pkgData.style, width: pkgW, height: pkgH }
        }
        pkg.style = { ...pkg.style, width: pkgW, height: pkgH }
        currentPkgX += pkgW + 100
      }
    })

    // 2. Position non-packaged standalone classes
    let startStandaloneX = 50
    let startStandaloneY = 80
    if (packages.length > 0) {
      let maxBottom = 0
      packages.forEach(p => {
        const h = (p.data as any)?.style?.height || 360
        maxBottom = Math.max(maxBottom, p.position.y + h)
      })
      startStandaloneY = maxBottom + 100
    }

    const standaloneByLevel = new Map<number, typeof standaloneNodes>()
    standaloneNodes.forEach(node => {
      const lvl = levels.get(node.id) || 0
      if (!standaloneByLevel.has(lvl)) standaloneByLevel.set(lvl, [])
      standaloneByLevel.get(lvl)!.push(node)
    })

    const sortedStandaloneLevels = Array.from(standaloneByLevel.keys()).sort((a, b) => a - b)
    
    let maxStandaloneCols = 0
    sortedStandaloneLevels.forEach(lvl => {
       maxStandaloneCols = Math.max(maxStandaloneCols, standaloneByLevel.get(lvl)!.length)
    })
    
    // Limit columns to avoid extremely wide diagrams if there are many nodes on same level
    const maxColsAllowed = 4

    sortedStandaloneLevels.forEach((lvl, rowIdx) => {
       const levelNodes = standaloneByLevel.get(lvl)!
       
       levelNodes.forEach((node, nodeIdx) => {
          const col = nodeIdx % maxColsAllowed
          const rowOffset = Math.floor(nodeIdx / maxColsAllowed)
          
          // Try to center if less than maxColsAllowed
          const currentLevelCols = Math.min(levelNodes.length, maxColsAllowed)
          const offsetX = (maxColsAllowed - currentLevelCols) * spacingX / 2

          node.position = {
            x: startStandaloneX + offsetX + col * spacingX,
            y: startStandaloneY + (rowIdx + rowOffset) * spacingY
          }
          if (node.data) node.data.position = { ...node.position }
       })
    })
  }

  return nextNodes
}
