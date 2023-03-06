import { Model } from "../model";
import { QueryBuilder } from "../query-builder";
import { Relation } from "./relation";

export class BelongsTo extends Relation {
  constructor(
    public query: QueryBuilder,
    public child: Model,
    public foreignKey: string,
    public ownerKey: string,
    public relationName: string
  ) {
    super(query);
  }

  associate(model: any) {
    this.child[this.foreignKey as keyof Model] = model.id;
    return this.child;
  }

  dissociate() {
    this.child[this.foreignKey as keyof Model] = null;
    return this.child;
  }

  addEagerConstraints(models: any[]): void {
    this.query.whereIn(
      this.ownerKey,
      models.map((model) => model[this.foreignKey as keyof Model])
    );
  }

  match(models: any[], results: any[], relationName: string): any {
    return models.map((model) => {
      model.setRelation(
        relationName,
        results.find(
          (result) =>
            result[this.ownerKey as keyof Model] ===
            model[this.foreignKey as keyof Model]
        )
      );

      return model;
    });
  }

  getResults(withConstraints = true) {
    if (withConstraints) {
      this.query
        .where(this.ownerKey, this.child[this.foreignKey as keyof Model])
        .first();
    }

    return (
      this.query
        /**
         * Cache the results on the child model.
         */
        .afterExecute((results) => {
          this.child.setRelation(this.relationName, results);
        })
        .get()
    );
  }
}
