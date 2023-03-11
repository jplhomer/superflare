import { registerJob } from "./registry";
import { MessagePayload } from "./queue";
import { serializeArguments } from "./serialize";
import { getQueue } from "./context";

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
  private toQueuePayload(constructorArgs: any[]): MessagePayload {
    return {
      job: this.constructor.name,
      payload: serializeArguments(constructorArgs),
    };
  }

  static register(job: any) {
    registerJob(job);
  }
}
