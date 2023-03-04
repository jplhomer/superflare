import { hydrateJobFromQueuePayload, JobPayload } from "./job";

export async function handleQueue(message: Message, ctx: ExecutionContext) {
  const job = await hydrateJobFromQueuePayload(message.body as JobPayload);

  await job.handle();
}
