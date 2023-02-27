import invariant from "tiny-invariant";
import { modelToTableName } from "./string";

export class QueryBuilder {
  #selects: string[] = [];
  #from: string;
  #bindings: any[] = [];
  #where: string[] = [];
  #orderBy: string[] = [];
  #limit: number | null = null;
  #single: boolean = false;
  #modelClass: any;
  #afterHooks: ((results: any) => void)[] = [];

  constructor(public modelInstance: any) {
    this.#modelClass = modelInstance.constructor;
    this.#from =
      this.#modelClass.table || modelToTableName(this.#modelClass.name);
  }

  select(...fields: string[]) {
    this.#selects.push(...fields);
    return this;
  }

  #connection() {
    return this.#modelClass.getConnection();
  }

  #buildQuery() {
    return [
      `select ${this.#selects.length ? this.#selects.join(",") : "*"}`,
      ` from ${this.#from}`,
      this.#where.length ? " where " + this.#where.join(", ") : "",
      this.#orderBy.length ? " order by " + this.#orderBy.join(", ") : "",
      this.#limit ? ` limit ${this.#limit}` : "",
    ].join("");
  }

  async #execute() {
    const query = this.#buildQuery();

    try {
      const dbResults = await this.#connection()
        .prepare(query)
        .bind(...this.#bindings)
        .all();

      invariant(dbResults.results, `Query failed: ${dbResults.error}`);

      if (this.#single) {
        const results = dbResults.results[0]
          ? this.#modelClass.instanceFromDB(dbResults.results[0])
          : null;

        this.#runCallbacks(results);

        return results;
      }

      const results = dbResults.results.map((data: any) =>
        this.#modelClass.instanceFromDB(data)
      );

      this.#runCallbacks(results);

      return results;
    } catch (e: any) {
      throw new DatabaseException(e?.cause || e?.message);
    }
  }

  #runCallbacks(results: any) {
    return this.#afterHooks.map((callback) => callback(results));
  }

  where(field: string, value: any): this;
  where(field: string, operator: string, value?: any): this;
  where(field: string, operator: string, value?: any) {
    if (!value) {
      value = operator;
      operator = "=";
    }

    this.#where.push(`${field} ${operator} ?`);
    this.#bindings.push(value);
    return this;
  }

  limit(limit: number) {
    this.#limit = limit;
    return this;
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc") {
    this.#orderBy.push(`${field} ${direction}`);
    return this;
  }

  all(): Promise<any> {
    return this.#execute();
  }

  first(): any {
    this.#single = true;
    return this.limit(1);
  }

  async insert(attributes: Record<string, any>): Promise<any> {
    try {
      const results = await this.#connection()
        .prepare(
          `insert into ${this.#from} (${Object.keys(attributes).join(
            ","
          )}) values (${Object.keys(attributes)
            .map((_, i) => `?`)
            .join(",")}) returning *`
        )
        .bind(...Object.values(attributes))
        .first();

      return results;
    } catch (e: any) {
      throw new DatabaseException(e?.cause || e?.message);
    }
  }

  async update(attributes: Record<string, any>): Promise<boolean> {
    const keysToUpdate = Object.keys(attributes).filter((key) => key !== "id");
    try {
      const results = await this.#connection()
        .prepare(
          `update ${this.#from} set ${keysToUpdate
            .map((key) => `${key} = ?`)
            .join(",")} where id = ?`
        )
        .bind(...keysToUpdate.map((key) => attributes[key]), attributes.id)
        .run();

      return results.success;
    } catch (e: any) {
      throw new DatabaseException(e?.cause || e?.message);
    }
  }

  async count() {
    this.select("count(*) as count");
    const query = this.#buildQuery();
    const results = await this.#connection()
      .prepare(query)
      .bind(...this.#bindings)
      .first();

    return results.count;
  }

  afterExecute(callback: (results: any) => any) {
    this.#afterHooks.push(callback);

    return this;
  }

  then(
    onfulfilled?: ((value: any) => any) | undefined | null,
    onrejected?: ((reason: any) => any) | undefined | null
  ) {
    const promise = this.all();
    return promise.then(onfulfilled, onrejected);
  }

  catch<FR = never>(
    onrejected?: ((reason: any) => FR | PromiseLike<FR>) | undefined | null
  ): Promise<any> {
    const promise = this.all();
    return promise.catch(onrejected);
  }
}

export class DatabaseException extends Error {}
