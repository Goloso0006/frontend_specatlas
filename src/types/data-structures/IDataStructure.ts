export interface IDataStructure<T> {
  insert(value: T): void;
  delete(value: T): boolean;
  search(value: T): boolean;
  clear(): void;
  toArray(): T[]; // Useful for the Facade to pass state to React easily
  getSize(): number;
}
