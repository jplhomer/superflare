import { Argv } from "yargs";
import { jobHandler, jobOptions } from "./generate/job";
import { migrationHandler, migrationOptions } from "./generate/migration";
import { modelHandler, modelOptions } from "./generate/model";

export function generate(yargs: Argv) {
  return yargs
    .command(
      "job <name>",
      "Generate a Job",
      // @ts-expect-error: IDK
      jobOptions,
      jobHandler
    )
    .command(
      "migration <name>",
      "Generate a Migration",
      // @ts-expect-error: IDK
      migrationOptions,
      migrationHandler
    )
    .command(
      "model <name>",
      "Generate a Model",
      // @ts-expect-error: IDK
      modelOptions,
      modelHandler
    );
}
