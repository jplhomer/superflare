/// <reference types="@cloudflare/workers-types" />

interface Env {
  CF_PAGES?: 1;
  DB: D1Database;
  REMIX_CMS_MEDIA: R2Bucket;
  SESSION_SECRET: string;
}
