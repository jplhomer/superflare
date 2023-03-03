#!/usr/bin/env node

import makeCLI from "yargs";
import { hideBin } from "yargs/helpers";
import { logger } from "./cli/logger";
import { generate } from "./cli/generate";
import type Yargs from "yargs";
import { consoleHandler, consoleOptions, createRepl } from "./cli/console";
import { CommonYargsArgv } from "./cli/yargs-types";
import { migrateHandler, migrateOptions } from "./cli/migrate";
import { devHandler, devOptions } from "./cli/dev";
import { db } from "./cli/db";

const resetColor = "\x1b[0m";
const fgGreenColor = "\x1b[32m";

export class CommandLineArgsError extends Error {}

function createCLIParser(argv: string[]) {
  const superflare: CommonYargsArgv = makeCLI(argv)
    .strict()
    .scriptName("superflare")
    .wrap(null)
    // Define global options here, so they get included in the `Argv` type of
    // the `superflare` variable
    .version(false)
    .option("v", {
      describe: "Show version number",
      alias: "version",
      type: "boolean",
    });

  superflare.help().alias("help", "h");

  // Help
  superflare.command(
    ["*"],
    false,
    () => {},
    async (args) => {
      if (args._.length > 0) {
        throw new CommandLineArgsError(`Unknown command: ${args._}.`);
      } else {
        superflare.showHelp("log");
      }
    }
  );

  // Default help command that supports the subcommands
  const subHelp: Yargs.CommandModule = {
    command: ["*"],
    handler: async (args) => {
      setImmediate(() =>
        superflare.parse([...args._.map((a) => `${a}`), "--help"])
      );
    },
  };

  // Migrate
  superflare.command(
    "migrate",
    "🏗️  Migrate your database and update types",
    migrateOptions,
    migrateHandler
  );

  // Dev
  superflare.command(
    "dev [entrypoint]",
    "🏄 Start the development server",
    devOptions,
    devHandler
  );

  // Generate
  superflare.command(
    ["generate", "g"],
    "🌇 Scaffold useful things",
    (yargs) => {
      return generate(yargs.command(subHelp));
    }
  );

  // Console
  superflare.command(
    ["console", "c"],
    "🔮 Open an interactive developer console",
    // @ts-expect-error idk
    consoleOptions,
    consoleHandler
  );

  // DB
  superflare.command("db", "🗄️  Manage your database", (yargs) => {
    return db(yargs.command(subHelp));
  });

  return superflare;
}

async function main(argv: string[]): Promise<void> {
  const superflare = createCLIParser(argv);
  try {
    await superflare.parse();
  } catch (e) {
    logger.log(""); // Just adds a bit of space
    if (e instanceof CommandLineArgsError) {
      logger.error(e.message);
      // We are not able to ask the `superflare` CLI parser to show help for a subcommand programmatically.
      // The workaround is to re-run the parsing with an additional `--help` flag, which will result in the correct help message being displayed.
      // The `superflare` object is "frozen"; we cannot reuse that with different args, so we must create a new CLI parser to generate the help message.
      await createCLIParser([...argv, "--help"]).parse();
    } else {
      logger.error(e instanceof Error ? e.message : e);
      logger.log(
        `${fgGreenColor}%s${resetColor}`,
        "If you think this is a bug then please create an issue at https://github.com/jplhomer/superflare/issues/new"
      );
    }
    throw e;
  }
}

main(hideBin(process.argv));
