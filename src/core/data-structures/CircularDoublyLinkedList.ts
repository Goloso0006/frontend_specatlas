import type { ILinkedList, IDoubleNode } from '../../types/data-structures';
import { NodeFactory } from '../../factories/data-structures/NodeFactory';

export class CircularDoublyLinkedList<T> implements ILinkedList<T, IDoubleNode<T>> {
  private head: IDoubleNode<T> | null;
  private tail: IDoubleNode<T> | null;
  private size: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  public getHead(): IDoubleNode<T> | null {
    return this.head;
  }

  public getTail(): IDoubleNode<T> | null {
    return this.tail;
  }

  public insert(value: T): void {
    this.insertAtTail(value);
  }

  public insertAtHead(value: T): void {
    const newNode = NodeFactory.createNode<T>('DOUBLE', value);
    if (!this.head || !this.tail) {
      this.head = newNode;
      this.tail = newNode;
      newNode.next = newNode;
      newNode.prev = newNode;
    } else {
      newNode.next = this.head;
      newNode.prev = this.tail;
      this.head.prev = newNode;
      this.tail.next = newNode;
      this.head = newNode;
    }
    this.size++;
  }

  public insertAtTail(value: T): void {
    const newNode = NodeFactory.createNode<T>('DOUBLE', value);
    if (!this.head || !this.tail) {
      this.head = newNode;
      this.tail = newNode;
      newNode.next = newNode;
      newNode.prev = newNode;
    } else {
      newNode.prev = this.tail;
      newNode.next = this.head;
      this.tail.next = newNode;
      this.head.prev = newNode;
      this.tail = newNode;
    }
    this.size++;
  }

  public delete(value: T): boolean {
    if (!this.head) return false;

    let current = this.head;
    let index = 0;
    
    // Using a do-while because it's circular
    do {
      if (current.value === value) {
        if (current === this.head && current === this.tail) {
          // Only one element
          this.head = null;
          this.tail = null;
        } else if (current === this.head) {
          this.deleteHead();
          return true; // deleteHead decrements size
        } else if (current === this.tail) {
          this.deleteTail();
          return true; // deleteTail decrements size
        } else {
          current.prev!.next = current.next;
          current.next!.prev = current.prev;
        }
        this.size--;
        return true;
      }
      current = current.next!;
      index++;
    } while (current !== this.head);

    return false;
  }

  public deleteHead(): IDoubleNode<T> | null {
    if (!this.head || !this.tail) return null;

    const removed = this.head;
    if (this.head === this.tail) {
      this.head = null;
      this.tail = null;
    } else {
      this.head = this.head.next;
      this.head!.prev = this.tail;
      this.tail.next = this.head;
    }
    this.size--;
    return removed;
  }

  public deleteTail(): IDoubleNode<T> | null {
    if (!this.tail || !this.head) return null;

    const removed = this.tail;
    if (this.head === this.tail) {
      this.head = null;
      this.tail = null;
    } else {
      this.tail = this.tail.prev;
      this.tail!.next = this.head;
      this.head.prev = this.tail;
    }
    this.size--;
    return removed;
  }

  public search(value: T): boolean {
    if (!this.head) return false;
    let current = this.head;
    do {
      if (current.value === value) return true;
      current = current.next!;
    } while (current !== this.head);
    return false;
  }

  public clear(): void {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  public toArray(): T[] {
    const result: T[] = [];
    if (!this.head) return result;
    
    let current = this.head;
    do {
      result.push(current.value);
      current = current.next!;
    } while (current !== this.head);
    
    return result;
  }

  public getSize(): number {
    return this.size;
  }
}
