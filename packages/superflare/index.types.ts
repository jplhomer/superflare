/**
 * Export everything from `index.ts` *except* Model, because we have to manually
 * compose and export types for Model/QueryBuilder.
 **/

export {
  setConfig,
  defineConfig,
  type SuperflareUserConfig,
  type DefineConfigResult,
} from "./src/config";
export { DatabaseException } from "./src/query-builder";
export { seed } from "./src/seeder";
export { storage, servePublicPathFromStorage } from "./src/storage";
export { Factory } from "./src/factory";
export { handleFetch } from "./src/fetch";
export { handleQueue } from "./src/queue";
export { SuperflareSession, Session } from "./src/session";
export { Job } from "./src/job";
export { SuperflareAuth } from "./src/auth";
export { hash } from "./src/hash";
export { Event } from "./src/event";
export { Listener } from "./src/listener";
export { handleWebSockets } from "./src/websockets";
export { Channel } from "./src/durable-objects/Channel";
export { Schema } from "./src/schema";

/**
 * Shape of the model instance.
 */
export interface ModelInstance<M> {
  id: number;
  hidden: string[];
  save(): Promise<boolean>;
  delete(): Promise<boolean>;
  update(attributes: any): Promise<boolean>;
  toJSON(): any;

  belongsTo<M extends BaseModel>(model: M): BelongsTo<M>;
  hasOne<M extends BaseModel>(model: M): HasOne<M>;
  hasMany<M extends BaseModel>(model: M): HasMany<M>;
}

export interface BelongsTo<M extends BaseModel, R = InstanceType<M>>
  extends QueryBuilder<M, R> {
  associate(model: any): R;
  dissociate(): R;
}

export interface HasOne<M extends BaseModel, R = InstanceType<M>>
  extends QueryBuilder<M, R> {
  save(model: any): Promise<R>;
  create(attributes: any): Promise<R>;
}

export interface HasMany<M extends BaseModel, R = InstanceType<M>[]>
  extends QueryBuilder<M, R> {
  save(model: any): Promise<R>;
  create(attributes: any): Promise<R>;
}

/**
 * Shape of the model constructor (static properties).
 */
export interface BaseModel<M = any> {
  find<T extends BaseModel>(this: T, ids: number[]): Promise<InstanceType<T>[]>;
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
  whereIn<T extends BaseModel>(
    this: T,
    field: string,
    values: (string | number)[]
  ): QueryBuilder<T>;
  with<T extends BaseModel>(
    this: T,
    relationName: string | string[]
  ): QueryBuilder<T>;
  create<T extends BaseModel>(
    this: T,
    attributes: any
  ): Promise<InstanceType<T>>;
  count<T extends BaseModel>(this: T): Promise<number>;
  query<T extends BaseModel>(this: T): QueryBuilder<T>;
  register(model: any): void;

  tableName: string;
  connection: string;

  new (attributes?: any): ModelInstance<M>;
}

interface QueryBuilder<T extends BaseModel, R = InstanceType<T>> {
  count<T>(this: T): Promise<number>;
  find<T>(this: T, id: number): Promise<null | R>;
  find<T>(this: T, ids: number[]): Promise<R[]>;
  where<T>(this: T, field: string, value: any): this;
  where<T>(this: T, field: string, operator: string, value?: any): this;
  whereIn<T>(this: T, field: string, values: (string | number)[]): this;
  with<T>(this: T, relationName: string | string[]): this;
  limit<T>(this: T, limit: number): this;
  get(): Promise<R[]>;
  first(): Promise<null | R>;
  orderBy<T>(this: T, field: string, direction?: "asc" | "desc"): this;
  then(onfulfilled?: (value: R[]) => R[] | PromiseLike<R[]>): Promise<R[]>;
  catch(onrejected?: (reason: any) => any): Promise<R[]>;
}

declare const Model: BaseModel;

export { Model };
