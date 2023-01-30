import { Config } from "./config";
import { QueryBuilder } from "./query-builder";
import type { Constructor } from "./types";

export class Model {
  static connection = "default";
  static tableName = "";
  id?: number;

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

  static count(): Promise<number> {
    return this.query().count();
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

  /**
   * Create a model with the attributes, and return an instance of the model.
   */
  static async create<M extends Model>(this: ModelClass<M>, attributes: any) {
    const model = new this(attributes);
    await model.save();
    return model;
  }

  async #performInsert() {
    const query = new QueryBuilder(this.constructor as ModelClass<Model>);
    const results = await query.insert(this.attributes);
    // TODO: Dedupe this.
    this.id = results.id;
    this.attributes.id = results.id;
    return true;
  }

  async #performUpdate() {
    const query = new QueryBuilder(this.constructor as ModelClass<Model>);
    await query.update(this.attributes);
    return true;
  }

  async save() {
    return this.id ? await this.#performUpdate() : await this.#performInsert();
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
