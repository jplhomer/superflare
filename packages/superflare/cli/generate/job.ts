import { writeFile } from "node:fs/promises";
import path from "node:path";
import { logger } from "../logger";
import { jobTemplate } from "../stubs/job.stub";
import { CommonYargsArgv, StrictYargsOptionsToInterface } from "../yargs-types";

export function jobOptions(arg: CommonYargsArgv) {
  return arg
    .positional("name", {
      type: "string",
      demandOption: true,
      description: "The name of the Job to generate",
    })
    .option("path", {
      type: "string",
      description: "The path to generate the Job in",
      default: path.join(process.cwd(), "app", "jobs"),
    });
}

export async function jobHandler(
  yargs: StrictYargsOptionsToInterface<typeof jobOptions>
) {
  logger.log(`Generating Job ${yargs.name}`);

  const output = jobTemplate(yargs.name);

  const jobPath = path.join(yargs.path, `${yargs.name}.ts`);
  await writeFile(jobPath, output);

  logger.log(`Generated Job ${yargs.name} at ${jobPath}`);
}
