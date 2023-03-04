import type { BaseModel } from "../index.types";
import { getJob, getModel, getQueue, registerJob } from "./config";
import { Model } from "./model";

export interface JobPayload {
  job: string;
  payload: any;
}

export abstract class Job {
  /**
   * The name of the queue on which to dispatch this job.
   */
  queue = "default";

  constructor() {}

  abstract handle(): Promise<void>;

  /**
   * The private instance method we use to dispatch a job onto the queue.
   */
  private async dispatch(...args: any[]) {
    const queueName = this.queue ?? "default";
    const queue = getQueue(queueName);

    if (!queue) {
      throw new Error(`Queue ${queueName} not found.`);
    }

    await queue.send(this.toQueuePayload(args));
  }

  /**
   * Dispatch the job with the given arguments.
   */
  static async dispatch<T extends Job>(
    this: new (...arg: any[]) => T,
    ...args: any[]
  ) {
    const job = new this(...args);
    return job.dispatch(...args);
  }

  /**
   * Convert the constructor arguments to a payload that can be sent to the queue.
   */
  private toQueuePayload(constructorArgs: any[]): JobPayload {
    return {
      job: this.constructor.name,
      payload: convertConstructorArgsToPayload(constructorArgs),
    };
  }

  static register(job: any) {
    registerJob(job);
  }
}

type Constructor<T> = new (...args: any[]) => T;

/**
 * Create an instance of a Job class from a Queue message payload.
 */
export async function hydrateJobFromQueuePayload(payload: JobPayload) {
  const jobClass = getJob(payload.job) as Constructor<Job>;
  const constructorArgs = await convertPayloadToConstructorArgs(
    payload.payload
  );
  const job = new jobClass(...constructorArgs);

  return job;
}

/**
 * Convert the constructor args to `Job.dispatch()` to a payload that can be sent to the queue.
 * This takes care of converting any `Model` instances to a JSON representation which can be
 * hydrated when the queue processes the job.
 */
function convertConstructorArgsToPayload(constructorArgs: any[]) {
  let payload: string[] = [];

  constructorArgs.forEach((arg) => {
    if (arg instanceof Model && arg.id) {
      const newValue = arg.toJSON();
      newValue.$class = arg.constructor.name;
      arg = { ...arg, id: arg.id };
      payload.push(JSON.stringify(newValue));
    } else {
      payload.push(JSON.stringify(arg));
    }
  });

  return payload;
}

/**
 * Convert the payload from the queue to the constructor args for the job.
 * This takes care of converting any JSON representations of `Model` instances to
 * hydrated `Model` instances.
 */
async function convertPayloadToConstructorArgs(payload: any[]) {
  let constructorArgs: any[] = [];

  for (const value of payload) {
    const arg = JSON.parse(value);
    if (arg instanceof Object && arg.$class && arg.id) {
      const modelClass = getModel(arg.$class) as BaseModel;

      if (!modelClass) {
        throw new Error(`Model ${arg.$class} not found.`);
      }

      const model = await modelClass.find(arg.id);

      constructorArgs.push(model);
    } else {
      constructorArgs.push(arg);
    }
  }

  return constructorArgs;
}
