/**
 * Export everything from `index.ts` *except* Model, because we have to manually
 * compose and export types for Model/QueryBuilder.
 **/

export * from "./config";
export { DatabaseException } from "./query-builder";
export { seed } from "./seeder";
export { storage, servePublicPathFromStorage } from "./storage";

/**
 * Shape of the model instance.
 */
export interface ModelInstance {
  id?: number;
  // TODO: Figure out how to not have this be `any`.
  attributes: any;
  save(): Promise<boolean>;
  toJSON(): ModelInstance["attributes"];
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
