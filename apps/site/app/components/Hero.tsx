import { Fragment, useState } from "react";
import clsx from "clsx";
import { Highlight } from "prism-react-renderer";

import { Button } from "~/components/Button";
import { HeroBackground } from "~/components/HeroBackground";
import blurCyanImage from "~/images/blur-cyan.png";
import blurIndigoImage from "~/images/blur-indigo.png";
import { Logo } from "./Logo";

const codeLanguage = "javascript";
const routeCode = `export async function action({ params }) {
  const post = await Post.find(params.postId);

  post.name = "New name";
  await post.save();

  NotifyContributorsJob.dispatch(post);

  return json({ post });
}`;
const modelCode = `import { Model } from 'superflare';

export class Post extends Model {
  contributors!: User[] | Promise<User[]>;
  $contributors() {
    return this.hasMany(User);
  }
}

Model.register(Post);`;
const jobCode = `export class NotifyContributorsJob extends Job {
  constructor(public post: Post) {}

  async perform() {
    const contributors = await this.post.contributors;
    // ...
  }
}\n\n`;

const tabs = [
  { name: "routes/$postId.edit.ts", isActive: true, code: routeCode },
  { name: "models/Post.ts", isActive: false, code: modelCode },
  { name: "jobs/NotifyContributorsJob.ts", isActive: false, code: jobCode },
];

function TrafficLightsIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg aria-hidden="true" viewBox="0 0 42 10" fill="none" {...props}>
      <circle cx="5" cy="5" r="4.5" />
      <circle cx="21" cy="5" r="4.5" />
      <circle cx="37" cy="5" r="4.5" />
    </svg>
  );
}

export function Hero() {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div className="overflow-hidden bg-slate-900 dark:-mb-32 dark:mt-[-4.5rem] dark:pb-32 dark:pt-[4.5rem] dark:lg:mt-[-4.75rem] dark:lg:pt-[4.75rem]">
      <div className="py-16 sm:px-2 lg:relative lg:py-20 lg:px-0">
        <div className="mx-auto grid max-w-2xl grid-cols-1 items-center gap-y-16 gap-x-8 px-4 lg:max-w-8xl lg:grid-cols-2 lg:px-8 xl:gap-x-16 xl:px-12">
          <div className="relative z-10 md:text-center lg:text-left">
            <img
              className="absolute bottom-full right-full -mr-72 -mb-56 opacity-50"
              src={blurCyanImage}
              alt=""
              width={530}
              height={530}
            />
            <div className="relative">
              <p className="inline bg-gradient-to-r from-red-200 via-rose-400 to-red-200 bg-clip-text font-display text-5xl tracking-tight text-transparent">
                A full-stack toolkit for Cloudflare Workers.
              </p>
              <p className="mt-3 text-2xl tracking-tight text-slate-400">
                The best parts of D1, R2, Queues, and more—all in one place.
              </p>
              <div className="mt-8 flex gap-4 md:justify-center lg:justify-start">
                <Button href="/getting-started" prefetch="intent">
                  Get started
                </Button>
                <Button
                  href="https://github.com/jplhomer/superflare"
                  variant="secondary"
                >
                  View on GitHub
                </Button>
              </div>
            </div>
          </div>
          <div className="relative lg:static xl:pl-10">
            <div className="absolute inset-x-[-50vw] -top-32 -bottom-48 [mask-image:linear-gradient(transparent,white,white)] dark:[mask-image:linear-gradient(transparent,white,transparent)] lg:left-[calc(50%+14rem)] lg:right-0 lg:-top-32 lg:-bottom-32 lg:[mask-image:none] lg:dark:[mask-image:linear-gradient(white,white,transparent)]">
              <HeroBackground className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0 lg:translate-y-[-60%]" />
            </div>
            <div className="relative">
              <img
                className="absolute -top-64 -right-64"
                src={blurCyanImage}
                alt=""
                width={530}
                height={530}
              />
              <img
                className="absolute -bottom-40 -right-44"
                src={blurIndigoImage}
                alt=""
                width={567}
                height={567}
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-rose-300 via-rose-300/70 to-red-300 opacity-10 blur-lg" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-rose-300 via-rose-300/70 to-red-300 opacity-10" />
              <div className="relative rounded-2xl bg-[#0A101F]/80 ring-1 ring-white/10 backdrop-blur">
                <div className="absolute -top-px left-20 right-11 h-px bg-gradient-to-r from-rose-300/0 via-rose-300/70 to-rose-300/0" />
                <div className="absolute -bottom-px left-11 right-20 h-px bg-gradient-to-r from-red-400/0 via-red-400 to-red-400/0" />
                <div className="pl-4 pt-4">
                  <TrafficLightsIcon className="h-2.5 w-auto stroke-slate-500/30" />
                  <div className="mt-4 flex space-x-2 text-xs max-lg:overflow-auto">
                    {tabs.map((tab) => (
                      <div
                        key={tab.name}
                        className={clsx(
                          "flex h-6 rounded-full",
                          activeTab.name === tab.name
                            ? "bg-gradient-to-r from-rose-400/30 via-rose-400 to-rose-400/30 p-px font-medium text-rose-300"
                            : "text-slate-500"
                        )}
                      >
                        <button
                          onClick={() => setActiveTab(tab)}
                          className={clsx(
                            "flex items-center rounded-full px-2.5",
                            activeTab.name === tab.name && "bg-slate-800"
                          )}
                        >
                          {tab.name}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-start px-1 text-sm">
                    <div
                      aria-hidden="true"
                      className="select-none border-r border-slate-300/5 pr-4 font-mono text-slate-600"
                    >
                      {Array.from({
                        length: activeTab.code.split("\n").length,
                      }).map((_, index) => (
                        <Fragment key={index}>
                          {(index + 1).toString().padStart(2, "0")}
                          <br />
                        </Fragment>
                      ))}
                    </div>
                    <Highlight
                      code={activeTab.code}
                      language={codeLanguage}
                      theme={undefined}
                    >
                      {({
                        className,
                        style,
                        tokens,
                        getLineProps,
                        getTokenProps,
                      }) => (
                        <pre
                          className={clsx(
                            className,
                            "flex overflow-x-auto pb-6"
                          )}
                          style={style}
                        >
                          <code className="px-4">
                            {tokens.map((line, lineIndex) => (
                              <div key={lineIndex} {...getLineProps({ line })}>
                                {line.map((token, tokenIndex) => (
                                  <span
                                    key={tokenIndex}
                                    {...getTokenProps({ token })}
                                  />
                                ))}
                              </div>
                            ))}
                          </code>
                        </pre>
                      )}
                    </Highlight>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
