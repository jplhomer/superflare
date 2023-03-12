import { defineConfig } from "./config";
import { type SuperflareSession } from "./session";

export async function handleFetch<Env>(
  {
    request,
    env,
    ctx,
    config,
    session,
    getSessionCookie,
  }: {
    request: Request;
    env: Env;
    ctx: ExecutionContext;
    config: ReturnType<typeof defineConfig<Env>>;
    session: SuperflareSession;
    /**
     * Superflare will commit changes to the session as a Cookie header on the outgoing response.
     * You must provide a way to get that cookie. This likely comes from your session storage.
     */
    getSessionCookie: () => Promise<string>;
  },
  getResponse: () => Promise<Response>
) {
  config({ request, env, ctx });

  /**
   * Some session storage mechanisms might not assign a proper `id`. No worries!
   * We will assign our own here as a value in the session itself.
   */
  if (!session.has("sessionId")) {
    session.set("sessionId", crypto.randomUUID());
  }

  /**
   * Run the framework code and get a response.
   */
  const response = await getResponse();

  if (session.isDirty()) {
    /**
     * Set the session cookie on the outgoing response's headers.
     */
    response.headers.set("Set-Cookie", await getSessionCookie());
  }

  return response;
}
