import { type SuperflareSession } from "./session";

export async function handleFetch<Env>(
  {
    session,
    getSessionCookie,
  }: {
    session: SuperflareSession;
    /**
     * Superflare will commit changes to the session as a Cookie header on the outgoing response.
     * You must provide a way to get that cookie. This likely comes from your session storage.
     */
    getSessionCookie: () => Promise<string>;
  },
  getResponse: () => Promise<Response>
) {
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
