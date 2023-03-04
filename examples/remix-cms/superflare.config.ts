import { defineConfig } from "superflare";

export default defineConfig<Env>((ctx) => {
  return {
    database: {
      default: ctx.env.DB,
    },
    storage: {
      default: {
        binding: ctx.env.REMIX_CMS_MEDIA,
        publicPath: "/storage/media",
      },
    },
    queues: {
      default: ctx.env.QUEUE,
    },
  };
});
