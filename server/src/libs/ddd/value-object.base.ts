export abstract class ValueObject<T extends object> {
  protected readonly props: Readonly<T>;

  constructor(props: T) {
    this.props = Object.freeze({ ...props });
  }

  equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (other.constructor !== this.constructor) {
      return false;
    }
    const keys = Object.keys(this.props) as (keyof T)[];
    return keys.every((k) => this.props[k] === other.props[k]);
  }
}
