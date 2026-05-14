import type { Node } from '@xyflow/react'
import type { DiagramPackageNodeDTO } from '../types/diagrams'

export function getPackageBounds(pkg: Node<DiagramPackageNodeDTO>) {
  const x = pkg.position.x
  const y = pkg.position.y
  const w = pkg.data?.style?.width ?? 520
  const h = pkg.data?.style?.height ?? 360
  return { x, y, width: w, height: h, x2: x + w, y2: y + h }
}

export function getNodeCenter(node: Node<any>) {
  const w = node.data?.style?.width ?? 160
  const h = node.data?.style?.height ?? 60
  return { x: node.position.x + w / 2, y: node.position.y + h / 2 }
}

export function isPointInsidePackage(point: { x: number; y: number }, pkg: Node<DiagramPackageNodeDTO>) {
  const b = getPackageBounds(pkg)
  return point.x >= b.x && point.x <= b.x2 && point.y >= b.y && point.y <= b.y2
}

export function findContainingPackage(node: Node<any>, packages: Node<DiagramPackageNodeDTO>[]) {
  const center = getNodeCenter(node)
  for (const pkg of packages) {
    if (pkg.id === node.id) continue
    if (isPointInsidePackage(center, pkg)) return pkg
  }
  return null
}

export function getPackageChildren(packageId: string, nodes: Node<any>[]) {
  return nodes.filter(n => n.data?.packageId === packageId)
}

export default {}
