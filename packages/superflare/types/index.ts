declare module "superflare" {
  export const Model: BaseModel;

  export interface ModelInstance {
    id?: number;
    attributes: any;
    save(): Promise<boolean>;
    toJSON(): ModelInstance["attributes"];
  }

  export interface BaseModel {
    first<T extends BaseModel>(this: T): Promise<null | InstanceType<T>>;
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
    then(onfulfilled?: (value: R[]) => R[] | PromiseLike<R[]>): Promise<R[]>;
    catch(onrejected?: (reason: any) => any): Promise<R[]>;
  }

  export interface SupercloudUserConfig {
    database?: D1Database;
  }

  export function config(userConfig: SupercloudUserConfig): void;

  export class Config {
    static database?: {
      connections: Record<string, D1Database>;
    };
  }
}
