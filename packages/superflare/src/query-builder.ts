import invariant from "tiny-invariant";
import { modelToTableName, sanitizeModuleName } from "./string";

export class QueryBuilder {
  private $selects: string[] = [];
  private $from: string;
  private $bindings: any[] = [];
  private $where: string[] = [];
  private $orderBy: string[] = [];
  private $eagerLoad: string[] = [];
  private $limit: number | null = null;
  private $single: boolean = false;
  private $modelClass: any;
  private $afterHooks: ((results: any) => void)[] = [];

  constructor(public modelInstance: any) {
    this.$modelClass = modelInstance.constructor;
    this.$from =
      this.$modelClass.table ||
      modelToTableName(sanitizeModuleName(this.$modelClass.name));

    if (this.$modelClass.$with) {
      this.$eagerLoad.push(...this.$modelClass.$with);
    }
  }

  select(...fields: string[]) {
    this.$selects.push(...fields);
    return this;
  }

  private connection() {
    return this.$modelClass.getConnection();
  }

  private buildQuery() {
    return [
      `select ${this.$selects.length ? this.$selects.join(",") : "*"}`,
      ` from ${this.$from}`,
      this.$where.length ? " where " + this.$where.join(" and ") : "",
      this.$orderBy.length ? " order by " + this.$orderBy.join(", ") : "",
      this.$limit ? ` limit ${this.$limit}` : "",
    ].join("");
  }

  public toSQL() {
    return this.buildQuery();
  }

  public dump() {
    console.log({
      query: this.toSQL(),
      bindings: this.$bindings,
    });

    return this;
  }

  private async execute() {
    const query = this.toSQL();

    try {
      const dbResults = await this.connection()
        .prepare(query)
        .bind(...this.$bindings)
        .all();

      invariant(dbResults.results, `Query failed: ${dbResults.error}`);

      let results = dbResults.results.map((data: any) =>
        this.$modelClass.instanceFromDB(data)
      );

      results = await this.eagerLoadRelations(results);

      let result = this.$single ? results[0] ?? null : results;

      this.runCallbacks(result);

      return result;
    } catch (e: any) {
      throw new DatabaseException(e?.cause || e?.message);
    }
  }

  private runCallbacks(results: any) {
    return this.$afterHooks.map((callback) => callback(results));
  }

  find(ids: number | number[]) {
    if (Array.isArray(ids)) {
      return this.whereIn("id", ids);
    }

    return this.where("id", ids).first();
  }

  where(field: string, value: any): this;
  where(field: string, operator: string, value?: any): this;
  where(field: string, operator: string, value?: any) {
    if (!value) {
      value = operator;
      operator = "=";
    }

    this.$where.push(`${field} ${operator} ?`);
    this.$bindings.push(value);
    return this;
  }

  whereIn(field: string, values: any[]) {
    this.$where.push(`${field} in (${values.map(() => "?").join(",")})`);
    this.$bindings.push(...values);
    return this;
  }

  with(relationName: string | string[]) {
    if (Array.isArray(relationName)) {
      this.$eagerLoad.push(...relationName);
    } else {
      this.$eagerLoad.push(relationName);
    }

    return this;
  }

  withOnly(relationName: string | string[]) {
    if (Array.isArray(relationName)) {
      this.$eagerLoad = relationName;
    } else {
      this.$eagerLoad = [relationName];
    }

    return this;
  }

  without (relationName: string | string[]) {
    if (Array.isArray(relationName)) {
      this.$eagerLoad = this.$eagerLoad.filter((relation) => !relationName.includes(relation));
    } else {
      this.$eagerLoad = this.$eagerLoad.filter((relation) => relation !== relationName);
    }

    return this;
  }

  limit(limit: number) {
    this.$limit = limit;
    return this;
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc") {
    this.$orderBy.push(`${field} ${direction}`);
    return this;
  }

  get(): Promise<any> {
    return this.execute();
  }

  first(): any {
    this.$single = true;
    return this.limit(1);
  }

  async insert(attributes: Record<string, any>): Promise<any> {
    try {
      const results = await this.connection()
        .prepare(
          `insert into ${this.$from} (${Object.keys(attributes).join(
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
      const results = await this.connection()
        .prepare(
          `update ${this.$from} set ${keysToUpdate
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

  async delete() {
    try {
      const results = await this.connection()
        .prepare(`delete from ${this.$from} where id = ?`)
        .bind(this.modelInstance.id)
        .run();

      return results.success;
    } catch (e: any) {
      throw new DatabaseException(e?.cause || e?.message);
    }
  }

  async count() {
    this.select("count(*) as count");
    const query = this.buildQuery();
    const results = await this.connection()
      .prepare(query)
      .bind(...this.$bindings)
      .first();

    return results.count;
  }

  afterExecute(callback: (results: any) => any) {
    this.$afterHooks.push(callback);

    return this;
  }

  private async eagerLoadRelations(models: any | any[]) {
    if (!this.$eagerLoad.length || !models) {
      return models;
    }

    let modelArray = Array.isArray(models) ? models : [models];

    for (const relationName of this.$eagerLoad) {
      modelArray = await this.eagerLoadRelation(relationName, modelArray);
    }

    return modelArray;
  }

  private async eagerLoadRelation(relationName: string, models: any[]) {
    const relation = this.$modelClass.getRelation(relationName);

    if (!relation) {
      throw new Error(`Relation ${relationName} does not exist`);
    }

    relation.addEagerConstraints(models);

    return relation.match(
      models,
      // Don't set typical constraints on the relation.
      await relation.getResults(false),
      relationName
    );
  }

  then(
    onfulfilled?: ((value: any) => any) | undefined | null,
    onrejected?: ((reason: any) => any) | undefined | null
  ) {
    const promise = this.get();
    return promise.then(onfulfilled, onrejected);
  }

  catch<FR = never>(
    onrejected?: ((reason: any) => FR | PromiseLike<FR>) | undefined | null
  ): Promise<any> {
    const promise = this.get();
    return promise.catch(onrejected);
  }
}

export class DatabaseException extends Error {}
