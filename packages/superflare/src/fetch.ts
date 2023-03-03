import { config, SuperflareUserConfig } from "./config";
import { Session } from "./session";

export async function handleFetch(
  {
    config: userConfig,
    session,
    getSessionCookie,
  }: {
    config: SuperflareUserConfig;
    session: Session;
    getSessionCookie: () => Promise<string>;
  },
  getResponse: () => Promise<Response>
) {
  /**
   * Set the user config into the singleton context.
   * TODO: Replace this with AsyncLocalStorage when available.
   */
  config({ ...userConfig, session });

  /**
   * Run the framework code and get a response.
   */
  const response = await getResponse();

  /**
   * Set the session cookie on the outgoing response's headers.
   */
  response.headers.set("Set-Cookie", await getSessionCookie());

  return response;
}
