import type { IDataStructure } from '../../types/data-structures';

export class QueueDS<T> implements IDataStructure<T> {
  private items: T[];

  constructor() {
    this.items = [];
  }

  public insert(value: T): void {
    this.enqueue(value);
  }

  public delete(value: T): boolean {
    const index = this.items.indexOf(value);
    if (index > -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }

  public search(value: T): boolean {
    return this.items.includes(value);
  }

  public clear(): void {
    this.items = [];
  }

  public toArray(): T[] {
    return [...this.items];
  }

  public getSize(): number {
    return this.items.length;
  }

  // Queue specific FIFO methods
  public enqueue(value: T): void {
    this.items.push(value);
  }

  public dequeue(): T | null {
    if (this.items.length === 0) return null;
    return this.items.shift() as T;
  }

  public peek(): T | null {
    if (this.items.length === 0) return null;
    return this.items[0];
  }
}
