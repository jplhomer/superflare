import { defineConfig } from "superflare";

import { LogArticleUpdated } from "~/listeners/LogArticleUpdated";

export default defineConfig<Env>((ctx) => {
  return {
    appKey: ctx.env.APP_KEY,
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
    listeners: {
      ArticleUpdated: [LogArticleUpdated],
    },
    channels: {
      default: {
        binding: ctx.env.CHANNELS,
      },
    },
  };
});
