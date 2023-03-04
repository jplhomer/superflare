import { Argv } from "yargs";
import { migrationHandler, migrationOptions } from "./generate/migration";

export function generate(yargs: Argv) {
  return yargs.command(
    "migration <name>",
    "Generate a migration",
    // @ts-expect-error: IDK
    migrationOptions,
    migrationHandler
  );
}
