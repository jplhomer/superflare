import { QueryBuilder } from "../query-builder";

export abstract class Relation {
  constructor(public query: QueryBuilder) {
    /**
     * Proxy any method calls to the underlying `QueryBuilder` instance.
     */
    return new Proxy(this, {
      get(target, prop) {
        if (prop in target) {
          return target[prop as keyof Relation];
        }

        if (prop in target.query) {
          return target.query[prop as keyof QueryBuilder];
        }

        return undefined;
      },
    });
  }

  abstract getResults(withConstraints: boolean): Promise<any>;
  abstract addEagerConstraints(models: any[]): void;
  abstract match(models: any[], results: any[], relationName: string): any;

  then(
    onfulfilled?: ((value: any) => any) | undefined | null,
    onrejected?: ((reason: any) => any) | undefined | null
  ) {
    const promise = this.getResults(true);
    return promise.then(onfulfilled, onrejected);
  }

  catch<FR = never>(
    onrejected?: ((reason: any) => FR | PromiseLike<FR>) | undefined | null
  ): Promise<any> {
    const promise = this.getResults(true);
    return promise.catch(onrejected);
  }
}
