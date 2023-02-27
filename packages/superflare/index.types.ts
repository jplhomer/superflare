/**
 * Export everything from `index.ts` *except* Model, because we have to manually
 * compose and export types for Model/QueryBuilder.
 **/

export { config } from "./src/config";
export { DatabaseException } from "./src/query-builder";
export { seed } from "./src/seeder";
export { storage, servePublicPathFromStorage } from "./src/storage";
export { Factory } from "./src/factory";

/**
 * Shape of the model instance.
 */
export interface ModelInstance {
  id?: number;
  // TODO: Figure out how to not have this be `any`.
  attributes: any;
  save(): Promise<boolean>;
  toJSON(): ModelInstance["attributes"];

  belongsTo<M extends BaseModel>(model: M): BelongsTo<M>;
  hasOne<M extends BaseModel>(model: M): HasOne<M>;
  hasMany<M extends BaseModel>(model: M): HasMany<M>;
}

export interface BelongsTo<M extends BaseModel, R = InstanceType<M>> {
  associate(model: any): R;
  dissociate(): R;

  then(onfulfilled?: (value: R[]) => R[] | PromiseLike<R[]>): Promise<R[]>;
  catch(onrejected?: (reason: any) => any): Promise<R>;
}

export interface HasOne<M extends BaseModel, R = InstanceType<M>> {
  save(model: any): Promise<R>;
  create(attributes: any): Promise<R>;

  then(onfulfilled?: (value: R[]) => R[] | PromiseLike<R[]>): Promise<R[]>;
  catch(onrejected?: (reason: any) => any): Promise<R>;
}

export interface HasMany<M extends BaseModel, R = InstanceType<M>[]>
  extends Promise<R> {
  save(model: any): Promise<R>;
  create(attributes: any): Promise<R>;
}

/**
 * Shape of the model constructor (static properties).
 */
export interface BaseModel {
  find<T extends BaseModel>(
    this: T,
    id: number
  ): Promise<null | InstanceType<T>>;
  first<T extends BaseModel>(this: T): Promise<null | InstanceType<T>>;
  orderBy<T extends BaseModel>(
    this: T,
    field: string,
    direction?: "asc" | "desc"
  ): QueryBuilder<T>;
  all<T extends BaseModel>(this: T): Promise<InstanceType<T>[]>;
  where<T extends BaseModel>(
    this: T,
    field: string,
    value: string | number
  ): QueryBuilder<T>;
  where<T extends BaseModel>(
    this: T,
    field: string,
    operator: string,
    value?: string | number
  ): QueryBuilder<T>;
  create<T extends BaseModel>(
    this: T,
    attributes: any
  ): Promise<InstanceType<T>>;
  count<T extends BaseModel>(this: T): Promise<number>;
  query<T extends BaseModel>(this: T): QueryBuilder<T>;

  tableName: string;
  connection: string;

  new (attributes: any): ModelInstance;
}

interface QueryBuilder<T extends BaseModel, R = InstanceType<T>> {
  where(field: string, value: any): this;
  where(field: string, operator: string, value?: any): this;
  limit(limit: number): this;
  all(): Promise<R[]>;
  first(): Promise<null | R>;
  orderBy<T extends BaseModel>(
    this: T,
    field: string,
    direction?: "asc" | "desc"
  ): this;
  then(onfulfilled?: (value: R[]) => R[] | PromiseLike<R[]>): Promise<R[]>;
  catch(onrejected?: (reason: any) => any): Promise<R[]>;
}

declare const Model: BaseModel;

export { Model };
