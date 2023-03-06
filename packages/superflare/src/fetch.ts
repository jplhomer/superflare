import { DefineConfigResult, setConfig, Config } from "./config";

export async function handleFetch<Env>(
  {
    config,
    getSessionCookie,
  }: {
    config: DefineConfigResult<Env>;
    /**
     * Superflare will commit changes to the session as a Cookie header on the outgoing response.
     * You must provide a way to get that cookie. This likely comes from your session storage.
     */
    getSessionCookie: () => Promise<string>;
  },
  getResponse: () => Promise<Response>
) {
  /**
   * Set the user config into the singleton context.
   * TODO: Replace this with AsyncLocalStorage when available.
   */
  const { userConfig } = config;
  setConfig(userConfig);

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
