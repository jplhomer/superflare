import { DefineConfigResult, setConfig, SuperflareUserConfig } from "./config";
import { hydrateJobFromQueuePayload, JobPayload } from "./job";

export async function handleQueue<Env>(
  config: DefineConfigResult<Env>,
  batch: MessageBatch
) {
  const { ctx, userConfig } = config;
  /**
   * Set the user config into the singleton context.
   * TODO: Replace this with AsyncLocalStorage when available.
   */
  setConfig(userConfig);

  return await Promise.all(
    batch.messages.map((message) => handleQueueMessage(message, ctx.ctx))
  );
}

async function handleQueueMessage(message: Message, ctx: ExecutionContext) {
  const job = await hydrateJobFromQueuePayload(message.body as JobPayload);

  await job.handle();
}
