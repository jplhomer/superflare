import { Argv } from "yargs";
import { jobHandler, jobOptions } from "./generate/job";
import { migrationHandler, migrationOptions } from "./generate/migration";

export function generate(yargs: Argv) {
  return yargs
    .command(
      "migration <name>",
      "Generate a Migration",
      // @ts-expect-error: IDK
      migrationOptions,
      migrationHandler
    )
    .command(
      "job <name>",
      "Generate a Job",
      // @ts-expect-error: IDK
      jobOptions,
      jobHandler
    );
}
