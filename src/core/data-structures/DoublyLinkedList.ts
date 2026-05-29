import type { ILinkedList, IDoubleNode } from '../../types/data-structures';
import { NodeFactory } from '../../factories/data-structures/NodeFactory';

export class DoublyLinkedList<T> implements ILinkedList<T, IDoubleNode<T>> {
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
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.next = this.head;
      this.head.prev = newNode;
      this.head = newNode;
    }
    this.size++;
  }

  public insertAtTail(value: T): void {
    const newNode = NodeFactory.createNode<T>('DOUBLE', value);
    if (!this.tail) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.prev = this.tail;
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this.size++;
  }

  public delete(value: T): boolean {
    let current = this.head;

    while (current) {
      if (current.value === value) {
        if (current === this.head) {
          this.deleteHead();
        } else if (current === this.tail) {
          this.deleteTail();
        } else {
          current.prev!.next = current.next;
          current.next!.prev = current.prev;
          this.size--;
        }
        return true;
      }
      current = current.next;
    }
    return false;
  }

  public deleteHead(): IDoubleNode<T> | null {
    if (!this.head) return null;

    const removed = this.head;
    if (this.head === this.tail) {
      this.head = null;
      this.tail = null;
    } else {
      this.head = this.head.next;
      this.head!.prev = null;
    }
    this.size--;
    return removed;
  }

  public deleteTail(): IDoubleNode<T> | null {
    if (!this.tail) return null;

    const removed = this.tail;
    if (this.head === this.tail) {
      this.head = null;
      this.tail = null;
    } else {
      this.tail = this.tail.prev;
      this.tail!.next = null;
    }
    this.size--;
    return removed;
  }

  public search(value: T): boolean {
    let current = this.head;
    while (current) {
      if (current.value === value) return true;
      current = current.next;
    }
    return false;
  }

  public clear(): void {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  public toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }

  public getSize(): number {
    return this.size;
  }
}
