import { DefineConfigResult, getEvent, getJob, setConfig } from "./config";
import { dispatchEvent, Event } from "./event";
import { Job } from "./job";
import { hydrateArguments } from "./serialize";

export interface MessagePayload {
  job?: string;
  event?: string;
  payload: any;
}

export async function handleQueue<Env>(
  config: DefineConfigResult,
  ctx: ExecutionContext,
  batch: MessageBatch
) {
  /**
   * Set the user config into the singleton context.
   * TODO: Replace this with AsyncLocalStorage when available.
   */
  setConfig(config);

  return await Promise.all(
    batch.messages.map((message) => handleQueueMessage(message, ctx))
  );
}

async function handleQueueMessage(message: Message, ctx: ExecutionContext) {
  const instance = await hydrateInstanceFromQueuePayload(
    message.body as MessagePayload
  );

  if (instance instanceof Job) {
    await instance.handle();
    return;
  }

  if (instance instanceof Event) {
    dispatchEvent(instance);
    return;
  }

  throw new Error(`Could not hydrate instance from queue payload.`);
}

/**
 * Create an instance of a Job or Event class from a Queue message payload.
 */
async function hydrateInstanceFromQueuePayload(payload: MessagePayload) {
  if (payload.event) {
    const eventClass = getEvent(payload.event) as Constructor<Event>;
    const constructorArgs = await hydrateArguments(payload.payload);
    const event = new eventClass(...constructorArgs);

    return event;
  }

  if (payload.job) {
    const jobClass = getJob(payload.job) as Constructor<Job>;
    const constructorArgs = await hydrateArguments(payload.payload);
    const job = new jobClass(...constructorArgs);

    return job;
  }

  throw new Error(`Job payload does not contain a job or event.`);
}

type Constructor<T> = new (...args: any[]) => T;
