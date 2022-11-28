import invariant from "tiny-invariant";
import type { Model, ModelClass } from "./model";

export class QueryBuilder<M extends Model, R = M[]> {
  #selects: string[] = [];
  #bindings: any[] = [];
  #where: string[] = [];
  #limit: number | null = null;
  #single: boolean = false;

  constructor(public model: ModelClass<M>) {}

  select(...fields: string[]) {
    this.#selects.push(...fields);
    return this;
  }

  #tableName() {
    return this.model.tableName;
  }

  #connection() {
    return this.model.getConnection();
  }

  #buildQuery() {
    return [
      `select ${this.#selects.length ? this.#selects.join(",") : "*"}`,
      ` from ${this.#tableName()}`,
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
