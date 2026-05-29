import type { IDataStructure } from '../../types/data-structures';

export class ArrayDS<T> implements IDataStructure<T> {
  private items: T[];

  constructor() {
    this.items = [];
  }

  public insert(value: T): void {
    this.items.push(value);
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

  // Array specific methods
  public insertAt(index: number, value: T): boolean {
    if (index < 0 || index > this.items.length) return false;
    this.items.splice(index, 0, value);
    return true;
  }

  public deleteAt(index: number): T | null {
    if (index < 0 || index >= this.items.length) return null;
    const deleted = this.items.splice(index, 1);
    return deleted[0];
  }
}
