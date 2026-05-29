import type { IDataStructure } from '../../types/data-structures';
import { ArrayDS } from '../../core/data-structures/ArrayDS';
import { StackDS } from '../../core/data-structures/StackDS';
import { QueueDS } from '../../core/data-structures/QueueDS';
import { SinglyLinkedList } from '../../core/data-structures/SinglyLinkedList';
import { DoublyLinkedList } from '../../core/data-structures/DoublyLinkedList';
import { CircularDoublyLinkedList } from '../../core/data-structures/CircularDoublyLinkedList';

export type SupportedDataStructure = 
  | 'ARRAY' 
  | 'STACK' 
  | 'QUEUE' 
  | 'SINGLY_LINKED_LIST' 
  | 'DOUBLY_LINKED_LIST' 
  | 'CIRCULAR_DOUBLY_LINKED_LIST';

/**
 * Facade Pattern: Hides the complexity of interacting with the different data structures.
 * Provides a clean interface for the React components to use.
 */
export class DataStructureFacade<T> {
  private currentStructure: IDataStructure<T> | null = null;
  private structureType: SupportedDataStructure | null = null;

  public initStructure(type: SupportedDataStructure): void {
    this.structureType = type;
    switch (type) {
      case 'ARRAY':
        this.currentStructure = new ArrayDS<T>();
        break;
      case 'STACK':
        this.currentStructure = new StackDS<T>();
        break;
      case 'QUEUE':
        this.currentStructure = new QueueDS<T>();
        break;
      case 'SINGLY_LINKED_LIST':
        this.currentStructure = new SinglyLinkedList<T>();
        break;
      case 'DOUBLY_LINKED_LIST':
        this.currentStructure = new DoublyLinkedList<T>();
        break;
      case 'CIRCULAR_DOUBLY_LINKED_LIST':
        this.currentStructure = new CircularDoublyLinkedList<T>();
        break;
      default:
        throw new Error(`Unsupported structure type: ${type}`);
    }
  }

  public insert(value: T): void {
    if (!this.currentStructure) throw new Error("Structure not initialized");
    this.currentStructure.insert(value);
  }

  public delete(value: T): boolean {
    if (!this.currentStructure) throw new Error("Structure not initialized");
    return this.currentStructure.delete(value);
  }

  public search(value: T): boolean {
    if (!this.currentStructure) throw new Error("Structure not initialized");
    return this.currentStructure.search(value);
  }

  public clear(): void {
    if (this.currentStructure) {
      this.currentStructure.clear();
    }
  }

  public toArray(): T[] {
    if (!this.currentStructure) return [];
    return this.currentStructure.toArray();
  }

  public getSize(): number {
    if (!this.currentStructure) return 0;
    return this.currentStructure.getSize();
  }

  public getActiveType(): SupportedDataStructure | null {
    return this.structureType;
  }
}
