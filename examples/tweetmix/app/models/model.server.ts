export class Model<TModelData> {
  constructor(public data: TModelData) {}

  static async serializeResults(results: any) {
    return results;
  }

  static async convertResultsToModels(results: any[]) {
    return Promise.all(
      results.map(
        async (result) => new this(await this.serializeResults(result))
      )
    );
  }

  /**
   * Convert relations in joined results to nested models.
   */
  static async convertRelationsToModels<T>(
    results: any,
    model: any,
    prefix: string
  ) {
    let modelResults: any = {};
    Object.keys(results).forEach((key) => {
      if (key.startsWith(prefix + "_")) {
        modelResults[key.replace(prefix + "_", "")] = results[key];
        delete results[key];
      }
    });

    return modelResults.id
      ? (new model(await model.serializeResults(modelResults)) as T)
      : null;
  }

  toJSON() {
    return this.data;
  }
}
