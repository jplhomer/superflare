import { Config } from "./config";
import { QueryBuilder } from "./query-builder";
import type { Constructor } from "./types";

export class Model {
  static connection = "default";
  static tableName = "";

  constructor(public attributes: any) {
    Object.assign(this, attributes);
  }

  static getConnection(): D1Database {
    if (!Config.database) {
      throw new Error("No database connection defined");
    }

    if (!Config.database.connections[this.connection]) {
      throw new Error(`No database connection defined for ${this.connection}`);
    }

    return Config.database.connections[this.connection];
  }

  static query<M extends Model>(this: ModelClass<M>) {
    return new QueryBuilder<M>(this);
  }

  static all<M extends Model>(this: ModelClass<M>) {
    return this.query<M>().select("*").all();
  }

  static first<M extends Model>(this: ModelClass<M>) {
    return this.query<M>().first();
  }

  static where<M extends Model>(
    this: ModelClass<M>,
    field: string,
    value: string | number
  ): QueryBuilder<M>;
  static where<M extends Model>(
    this: ModelClass<M>,
    field: string,
    operator: string,
    value?: string | number
  ): QueryBuilder<M>;
  static where<M extends Model>(
    this: ModelClass<M>,
    field: string,
    operator: string,
    value?: string | number
  ) {
    return this.query<M>().where(field, operator, value);
  }

  toJSON() {
    return this.attributes;
  }
}

export interface ModelConstructor<M extends Model> extends Constructor<M> {}

export interface ModelClass<M extends Model> extends ModelConstructor<M> {
  tableName: string;
  connection: string;
  getConnection(): D1Database;
  query<M extends Model>(): QueryBuilder<M>;
}
