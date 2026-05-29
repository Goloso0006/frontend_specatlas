import type { INode, ISingleNode, IDoubleNode } from '../../types/data-structures';
import { SingleNode } from '../../core/data-structures/nodes/SingleNode';
import { DoubleNode } from '../../core/data-structures/nodes/DoubleNode';

export type NodeType = 'SINGLE' | 'DOUBLE';

export class NodeFactory {
  /**
   * Factory method to create nodes based on the requested type.
   * This avoids large if/else blocks across the app when instantiating new nodes.
   * 
   * @param type The type of node to create (SINGLE or DOUBLE)
   * @param value The value to store in the node
   * @returns An instantiated node of the correct type
   */
  public static createNode<T>(type: 'SINGLE', value: T): ISingleNode<T>;
  public static createNode<T>(type: 'DOUBLE', value: T): IDoubleNode<T>;
  public static createNode<T>(type: NodeType, value: T): INode<T> {
    switch (type) {
      case 'SINGLE':
        return new SingleNode<T>(value);
      case 'DOUBLE':
        return new DoubleNode<T>(value);
      default:
        throw new Error(`Unsupported node type: ${type}`);
    }
  }
}
