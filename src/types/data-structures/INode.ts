export interface INode<T> {
  value: T;
  id: string; // Used for React keys and animation tracking
}

export interface ISingleNode<T> extends INode<T> {
  next: ISingleNode<T> | null;
}

export interface IDoubleNode<T> extends INode<T> {
  next: IDoubleNode<T> | null;
  prev: IDoubleNode<T> | null;
}
