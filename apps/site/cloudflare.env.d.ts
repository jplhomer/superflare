/// <reference types="@cloudflare/workers-types" />

/**
 * This is only used in Workers mode.
 */
declare module "__STATIC_CONTENT_MANIFEST" {
  const value: string;
  export default value;
}

interface Env {
  /**
   * Only used in Workers mode.
   */
  __STATIC_CONTENT: string;

  DB: D1Database;
  REMIX_CMS_MEDIA: R2Bucket;
  SESSION_SECRET: string;
  QUEUE: Queue;
}
