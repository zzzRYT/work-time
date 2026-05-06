export abstract class Entity<T> {
  protected readonly _id: string;
  protected _createdAt: Date;
  protected _updatedAt: Date;
  protected _deletedAt?: Date;

  constructor(props: {
    id: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
  }) {
    const now = new Date();
    this._id = props.id;
    this._createdAt = props.createdAt ?? now;
    this._updatedAt = props.updatedAt ?? this._createdAt;
    this._deletedAt = props.deletedAt;
  }

  get id(): string { return this._id; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get deletedAt(): Date | undefined { return this._deletedAt; }
  get isDeleted(): boolean { return this._deletedAt !== undefined; }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  delete(): void {
    if (this._deletedAt) return;
    this._deletedAt = new Date();
    this._updatedAt = this._deletedAt;
  }

  restore(): void {
    if (!this._deletedAt) return;
    this._deletedAt = undefined;
    this.touch();
  }

  equals(other: Entity<T>): boolean {
    return this._id === other._id;
  }
}
