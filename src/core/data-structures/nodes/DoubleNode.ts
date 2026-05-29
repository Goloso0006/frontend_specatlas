import type { IDoubleNode } from '../../../types/data-structures';

export class DoubleNode<T> implements IDoubleNode<T> {
  public value: T;
  public id: string;
  public next: IDoubleNode<T> | null;
  public prev: IDoubleNode<T> | null;

  constructor(value: T) {
    this.value = value;
    // Generate a simple unique ID for React rendering and animations
    this.id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    this.next = null;
    this.prev = null;
  }
}
