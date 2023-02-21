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
    return new Proxy(this, {
      get(target, prop) {
        if (prop in target) {
          return target[prop as keyof Model];
        }

        if (prop in target.attributes) {
          return target.attributes[prop];
        }

        return undefined;
      },

      set(target, prop, value) {
        if (prop in target) {
          target[prop as keyof Model] = value;
          return true;
        }

        // Everything else goes in the `attributes` bag.
        target.attributes[prop] = value;
        return true;
      },
    });
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

  private async performInsert() {
    const query = new QueryBuilder(this.constructor);
    const results = await query.insert(this.attributes);
    this.id = results.id;
    return true;
  }

  private async performUpdate() {
    const query = new QueryBuilder(this.constructor);
    await query.update(this.attributes);
    return true;
  }

  async save() {
    return this.id ? await this.performUpdate() : await this.performInsert();
  }

  toJSON() {
    return this.attributes;
  }
}

export interface ModelConstructor<M extends Model> extends Constructor<M> {}
