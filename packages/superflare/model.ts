import { Config } from "./config";
import { QueryBuilder } from "./query-builder";

interface Constructor<T> {
  new (...args: any): T;
}

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

  static query() {
    return new QueryBuilder(this);
  }

  static all() {
    return this.query().select("*").all();
  }

  static first() {
    return this.query().first();
  }

  static count(): Promise<number> {
    return this.query().count();
  }

  static where(field: string, value: string | number): any;
  static where(field: string, operator: string, value?: string | number): any;
  static where(field: string, operator: string, value?: string | number) {
    return this.query().where(field, operator, value);
  }

  /**
   * Create a model with the attributes, and return an instance of the model.
   */
  static async create(attributes: any) {
    const model = new this(attributes);
    await model.save();
    return model;
  }

  async #performInsert() {
    const query = new QueryBuilder(this.constructor);
    const results = await query.insert(this.attributes);
    // TODO: Dedupe this.
    this.id = results.id;
    this.attributes.id = results.id;
    return true;
  }

  async #performUpdate() {
    const query = new QueryBuilder(this.constructor);
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
