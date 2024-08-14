import { type Request } from "@cloudflare/workers-types";
import {
  type AppLoadContext,
  createCookieSessionStorage,
} from "@remix-run/cloudflare";
import type { SuperflareAuth, SuperflareSession } from "superflare";
import { type PlatformProxy } from "wrangler";

// NOTE: PlatformProxy’s caches property is incompatible with the caches global
// https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/src/api/integrations/platform/caches.ts
export type Cloudflare<Env extends { APP_KEY: string }> = Omit<
  PlatformProxy<Env>,
  "dispose" | "caches" | "cf"
> & {
  caches: CacheStorage;
  cf: Request["cf"];
};

// Shared implementation compatible with Vite, Wrangler, and Workers
export async function getLoadContext<Env extends { APP_KEY: string }>(payload: {
  request: Request;
  context: { cloudflare: Cloudflare<Env> };
  SuperflareAuth: typeof SuperflareAuth;
  SuperflareSession: typeof SuperflareSession;
}): Promise<AppLoadContext & { cloudflare: Cloudflare<Env> }> {
  const { request, context } = payload;
  const { env } = context.cloudflare;
  if (!env.APP_KEY) {
    throw new Error(
      "APP_KEY is required. Please ensure you have defined it as an environment variable."
    );
  }

  const { getSession, commitSession } = createCookieSessionStorage({
    cookie: {
      httpOnly: true,
      path: "/",
      secure: /^(http|ws)s:\/\//.test(request.url),
      secrets: [env.APP_KEY],
    },
  });

  const session = new payload.SuperflareSession(
    await getSession(request.headers.get("Cookie"))
  );

  // Ensure we have a sessionId here (instead of in superflare#handleFetch)
  if (!session.has("sessionId")) {
    session.set("sessionId", crypto.randomUUID());
  }

  /**
   * We inject auth and session into the Remix load context.
   * Someday, we could replace this with AsyncLocalStorage.
   */
  return {
    ...context,
    session,
    auth: new payload.SuperflareAuth(session),
    getSessionCookie: () => commitSession(session.getSession()),
  };
}
