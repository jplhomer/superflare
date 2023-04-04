import { BaseModel } from "../index.types";
import { getModel } from "./registry";
import { Model } from "./model";

/**
 * Convert the constructor args to an instance and conver them to a payload that can be sent to the queue.
 * This takes care of converting any `Model` instances to a JSON representation which can be
 * hydrated when the queue processes the job.
 */
export function serializeArguments(args: any[]): string[] {
  return args.map((arg) => {
    if (arg instanceof Model && arg.id) {
      const newValue = arg.toJSON();
      newValue.$model = arg.constructor.name;
      arg = { ...arg, id: arg.id };
      return JSON.stringify(newValue);
    } else {
      return JSON.stringify(arg);
    }
  });
}

export async function hydrateArguments(args: string[]): Promise<any[]> {
  return await Promise.all(
    args.map(async (value) => {
      const arg = JSON.parse(value);
      if (arg instanceof Object && arg.$model && arg.id) {
        const modelClass = getModel(arg.$model) as BaseModel;

        if (!modelClass) {
          throw new Error(`Model ${arg.$model} not found.`);
        }

        return await modelClass.find(arg.id);
      } else {
        return arg;
      }
    })
  );
}
