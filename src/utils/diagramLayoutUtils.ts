import type { Node, Edge } from '@xyflow/react'
import type { DiagramNodeDTO, DiagramRelationDTO, DiagramType } from '../types/diagrams'

/**
 * Automatically arranges class and use case diagrams for optimal visual hierarchy,
 * spacing, and containment.
 */
export function autoLayoutDiagram(
  nodes: Node<DiagramNodeDTO>[],
  _edges: Edge<DiagramRelationDTO>[],
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

    const spacingY = 160
    const actorXLeft = 80
    const actorXRight = 950
    const useCaseStartX = 340
    const useCaseSpacingX = 300
    const useCaseSpacingY = 140

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
    const cols = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(useCases.length))))
    useCases.forEach((uc, index) => {
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
          maxX = Math.max(maxX, uc.position.x + 180)
          maxY = Math.max(maxY, uc.position.y + 80)
        })

        if (minX === Infinity) {
          minX = useCaseStartX - 40
          minY = 40
          maxX = useCaseStartX + 300
          maxY = 400
        } else {
          minX -= 40
          minY -= 60
          maxX += 40
          maxY += 40
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

    const spacingX = 280
    const spacingY = 280
    let currentPkgX = 50
    let currentPkgY = 80

    // 1. Position packaged child classes inside their packages
    packages.forEach(pkg => {
      const children = nextNodes.filter(n => (n.data as any).packageId === pkg.id)
      
      pkg.position = { x: currentPkgX, y: currentPkgY }
      if (pkg.data) pkg.data.position = { ...pkg.position }

      if (children.length > 0) {
        const childrenCols = Math.ceil(Math.sqrt(children.length))
        children.forEach((child, idx) => {
          const cCol = idx % childrenCols
          const cRow = Math.floor(idx / childrenCols)
          
          const relX = 40 + cCol * spacingX
          const relY = 80 + cRow * spacingY
          child.position = {
            x: pkg.position.x + relX,
            y: pkg.position.y + relY
          }
          if (child.data) child.data.position = { ...child.position }
        })

        const pkgW = childrenCols * spacingX + 60
        const pkgH = Math.ceil(children.length / childrenCols) * spacingY + 110

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

    const standaloneCols = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(standaloneNodes.length))))
    standaloneNodes.forEach((node, index) => {
      const col = index % standaloneCols
      const row = Math.floor(index / standaloneCols)
      node.position = {
        x: startStandaloneX + col * spacingX,
        y: startStandaloneY + row * spacingY
      }
      if (node.data) node.data.position = { ...node.position }
    })
  }

  return nextNodes
}
