import invariant from "tiny-invariant";
import type { Model, ModelClass } from "./model";

export class QueryBuilder<M extends Model, R = M[]> {
  #selects: string[] = [];
  #from: string;
  #bindings: any[] = [];
  #where: string[] = [];
  #limit: number | null = null;
  #single: boolean = false;

  constructor(public model: ModelClass<M>) {
    this.#from = model.tableName;
  }

  select(...fields: string[]) {
    this.#selects.push(...fields);
    return this;
  }

  #connection() {
    return this.model.getConnection();
  }

  #buildQuery() {
    return [
      `select ${this.#selects.length ? this.#selects.join(",") : "*"}`,
      ` from ${this.#from}`,
      this.#where.length ? " where " + this.#where.join(", ") : "",
      this.#limit ? ` limit ${this.#limit}` : "",
    ].join("");
  }

  async #execute() {
    const query = this.#buildQuery();
    const results = await this.#connection()
      .prepare(query)
      .bind(...this.#bindings)
      .all();

    invariant(results.results, `Query failed: ${results.error}`);

    if (this.#single) {
      return new this.model(results.results[0]) || null;
    }

    return results.results.map((data) => new this.model(data));
  }

  where(field: string, value: any): this;
  where(field: string, operator: string, value?: any): this;
  where(field: string, operator: string, value?: any) {
    if (!value) {
      value = operator;
      operator = "=";
    }

    const nextBinding = this.#bindings.length + 1;
    this.#where.push(`${field} ${operator} ?${nextBinding}`);
    this.#bindings.push(value);
    return this;
  }

  limit(limit: number) {
    this.#limit = limit;
    return this;
  }

  all(): Promise<R> {
    return this.#execute();
  }

  first(): QueryBuilder<M, M | null> {
    this.#single = true;
    return this.limit(1);
  }

  async insert(attributes: Record<string, any>): Promise<Record<string, any>> {
    const id = await this.#connection()
      .prepare(
        `insert into ${this.#from} (${Object.keys(attributes).join(
          ","
        )}) values (${Object.keys(attributes)
          .map((_, i) => `?`)
          .join(",")}) returning id`
      )
      .bind(...Object.values(attributes))
      .first<number>("id");

    return {
      ...attributes,
      id,
    };
  }

  async update(attributes: Record<string, any>): Promise<boolean> {
    const keysToUpdate = Object.keys(attributes).filter((key) => key !== "id");
    const results = await this.#connection()
      .prepare(
        `update ${this.#from} set ${keysToUpdate
          .map((key) => `${key} = ?`)
          .join(",")} where id = ?`
      )
      .bind(...keysToUpdate.map((key) => attributes[key]), attributes.id)
      .run();

    return results.success;
  }

  async count() {
    this.select("count(*) as count");
    const query = this.#buildQuery();
    const results = await this.#connection()
      .prepare(query)
      .bind(...this.#bindings)
      .first<{ count: number }>();

    return results.count;
  }

  then<R1 = R, R2 = never>(
    onfulfilled?: ((value: R) => R1 | PromiseLike<R1>) | undefined | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | undefined | null
  ): Promise<R1 | R2> {
    const promise = this.all();
    return promise.then(onfulfilled, onrejected);
  }

  catch<FR = never>(
    onrejected?: ((reason: any) => FR | PromiseLike<FR>) | undefined | null
  ): Promise<R | FR> {
    const promise = this.all();
    return promise.catch(onrejected);
  }
}
