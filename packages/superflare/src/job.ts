import { getQueue, registerJob } from "./config";
import { MessagePayload } from "./queue";
import { serializeArguments } from "./serialize";

export abstract class Job {
  /**
   * The name of the queue on which to dispatch this job.
   */
  queue = "default";

  env: any;
  ctx: any;

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
	static async dispatch<T extends Job, Args extends any[]>(
		this: new (...args: Args) => T,
		...args: Args
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
