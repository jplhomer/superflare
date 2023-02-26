import { Config } from "./config";
import { QueryBuilder } from "./query-builder";

interface Constructor<T> {
  new (...args: any): T;
}

export class Model {
  static connection = "default";
  static table = "";
  id?: number;

  constructor(public attributes: any) {
    this.attributes = attributes;
    Object.keys(attributes).forEach((key) => {
      this[key as keyof Model] = attributes[key];
    });

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
        target[prop as keyof Model] = value;
        target.attributes[prop] = value;
        return true;
      },
    });
  }

  static getConnection(): D1Database {
    if (!Config.database) {
      throw new Error("No database connection defined");
    }

    if (!Config.database?.connections?.[this.connection]) {
      throw new Error(`No database connection defined for ${this.connection}`);
    }

    return Config.database?.connections?.[this.connection];
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

  static find(id: number) {
    return this.query().where("id", id).first();
  }

  static orderBy(field: string, direction: "asc" | "desc" = "asc") {
    return this.query().orderBy(field, direction);
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

  serialize() {
    return {
      ...this.attributes,
    };
  }

  toJSON() {
    return this.serialize();
  }
}

export interface ModelConstructor<M extends Model> extends Constructor<M> {}
