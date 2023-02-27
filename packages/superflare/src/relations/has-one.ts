import { Model } from "../model";
import { QueryBuilder } from "../query-builder";
import { Relation } from "./relation";

export class HasOne extends Relation {
  constructor(
    public query: QueryBuilder,
    public parent: Model,
    public foreignKey: string,
    public ownerKey: string,
    public relationName: string
  ) {
    super(query);
  }

  async save(model: any) {
    model[this.foreignKey as keyof Model] =
      this.parent[this.ownerKey as keyof Model];
    await model.save();
    return model;
  }

  async create(attributes: any) {
    const model = new this.query.modelInstance.constructor(attributes);
    model[this.foreignKey as keyof Model] =
      this.parent[this.ownerKey as keyof Model];
    await model.save();
    return model;
  }

  addEagerConstraints(models: any[]): void {
    this.query.whereIn(
      this.foreignKey,
      models.map((model) => model[this.ownerKey as keyof Model])
    );
  }

  match(models: any[], results: any[], relationName: string): any {
    return models.map((model) => {
      model[relationName] = results.find(
        (result) => result[this.foreignKey as keyof Model] === model.id
      );

      return model;
    });
  }

  getResults(withConstraints = true) {
    if (withConstraints) {
      this.query
        .where(this.foreignKey, this.parent[this.ownerKey as keyof Model])
        .first();
    }

    return (
      this.query
        /**
         * Cache the results on the parent model.
         */
        .afterExecute((results) => {
          this.parent[this.relationName as keyof Model] = results;
        })
        .get()
    );
  }
}
