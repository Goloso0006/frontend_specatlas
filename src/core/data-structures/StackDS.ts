import type { IDataStructure } from '../../types/data-structures';

export class StackDS<T> implements IDataStructure<T> {
  private items: T[];

  constructor() {
    this.items = [];
  }

  public insert(value: T): void {
    this.push(value);
  }

  public delete(value: T): boolean {
    // Stacks don't typically delete by value, but to satisfy the interface:
    const index = this.items.lastIndexOf(value); // Last occurrence since it's LIFO conceptually
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

  // Stack specific LIFO methods
  public push(value: T): void {
    this.items.push(value);
  }

  public pop(): T | null {
    if (this.items.length === 0) return null;
    return this.items.pop() as T;
  }

  public peek(): T | null {
    if (this.items.length === 0) return null;
    return this.items[this.items.length - 1];
  }
}
