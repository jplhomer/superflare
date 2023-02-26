import type { Model } from "../index.types";

export class Factory {
  #definition: () => Record<string, any> = () => ({});
  constructor(public model: typeof Model) {}

  static for(model: typeof Model) {
    return new this(model);
  }

  create(attributes?: Record<string, any>) {
    return this.model.create({
      ...this.#definition(),
      ...(attributes ?? {}),
    });
  }

  definition(definition: () => Record<string, any>) {
    this.#definition = definition;
    return this;
  }
}
