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

  getResults() {
    return (
      this.query
        .where(this.ownerKey, this.child[this.foreignKey as keyof Model])
        /**
         * Cache the results on the child model.
         */
        .afterExecute((results) => {
          this.child[this.relationName as keyof Model] = results;
        })
        .first()
    );
  }
}
