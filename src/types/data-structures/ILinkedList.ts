import type { IDataStructure } from './IDataStructure';
import type { INode } from './INode';

export interface ILinkedList<T, NodeType extends INode<T>> extends IDataStructure<T> {
  getHead(): NodeType | null;
  getTail(): NodeType | null;
  
  // Specific list operations
  insertAtHead(value: T): void;
  insertAtTail(value: T): void;
  deleteHead(): NodeType | null;
  deleteTail(): NodeType | null;
}
