import type { ILinkedList, ISingleNode } from '../../types/data-structures';
import { NodeFactory } from '../../factories/data-structures/NodeFactory';

export class SinglyLinkedList<T> implements ILinkedList<T, ISingleNode<T>> {
  private head: ISingleNode<T> | null;
  private tail: ISingleNode<T> | null;
  private size: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  public getHead(): ISingleNode<T> | null {
    return this.head;
  }

  public getTail(): ISingleNode<T> | null {
    return this.tail;
  }

  public insert(value: T): void {
    this.insertAtTail(value);
  }

  public insertAtHead(value: T): void {
    const newNode = NodeFactory.createNode<T>('SINGLE', value);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.next = this.head;
      this.head = newNode;
    }
    this.size++;
  }

  public insertAtTail(value: T): void {
    const newNode = NodeFactory.createNode<T>('SINGLE', value);
    if (!this.tail) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this.size++;
  }

  public delete(value: T): boolean {
    if (!this.head) return false;

    if (this.head.value === value) {
      this.deleteHead();
      return true;
    }

    let current = this.head;
    while (current.next && current.next.value !== value) {
      current = current.next;
    }

    if (current.next) {
      current.next = current.next.next;
      if (!current.next) {
        this.tail = current; // Updated tail
      }
      this.size--;
      return true;
    }

    return false;
  }

  public deleteHead(): ISingleNode<T> | null {
    if (!this.head) return null;

    const removed = this.head;
    this.head = this.head.next;
    if (!this.head) {
      this.tail = null;
    }
    this.size--;
    return removed;
  }

  public deleteTail(): ISingleNode<T> | null {
    if (!this.head) return null;

    if (this.head === this.tail) {
      return this.deleteHead();
    }

    let current = this.head;
    while (current.next && current.next !== this.tail) {
      current = current.next;
    }

    const removed = this.tail;
    current.next = null;
    this.tail = current;
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
