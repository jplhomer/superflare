import { start } from "node:repl";
import { readdir } from "node:fs/promises";
import { register } from "esbuild-register/dist/node";
import { homedir } from "node:os";
import { inspect } from "node:util";
import path from "node:path";
import { CommonYargsArgv, StrictYargsOptionsToInterface } from "./yargs-types";
import { getD1Database } from "./d1-database";

export function consoleOptions(yargs: CommonYargsArgv) {
  return yargs
    .option("db", {
      alias: "d",
      describe: "The name of the D1 database binding",
      default: "DB",
    })
    .option("models", {
      alias: "m",
      describe: "Path to the models directory",

      // Default to the path in the app directory
      default: path.join(process.cwd(), "app", "models"),
    });
}

export async function consoleHandler(
  argv: StrictYargsOptionsToInterface<typeof consoleOptions>
) {
  const modelsDirectory = argv.models;
  const dbName = argv.db;

  return createRepl({ modelsDirectory, dbName });
}

export async function createRepl({
  modelsDirectory,
  dbName,
}: {
  modelsDirectory: string;
  dbName: string;
}) {
  /**
   * We're going to be importing some TS files, so we need to register esbuild.
   */
  register();

  /**
   * Create a REPL server.
   */
  const server = start({
    prompt: ">> ",
    input: process.stdin,
    output: process.stdout,
    terminal:
      process.stdout.isTTY && !parseInt(process.env.NODE_NO_READLINE!, 10),
    useGlobal: true,
    writer: (output) => {
      return (
        inspect(output, {
          colors: true,
          showProxy: false,
        })
          .split("\n")
          .map((line, idx) => (idx === 0 ? "=> " + line : "   " + line))
          .join("\n") + "\n"
      );
    },
  });

  /**
   * Set up history for the REPL.
   */
  const historyPath = `${homedir()}/.superflare_history`;
  server.setupHistory(historyPath, () => {});

  /**
   * Assign a `db` context with the current database.
   */
  const db = await getD1Database(dbName);
  server.context["db"] = db;

  /**
   * Run the Superflare `config` to ensure Models have access to the database.
   */
  server.eval(
    `const {setConfig} = require('superflare'); setConfig({database: { default: db }});`,
    server.context,
    "repl",
    () => {}
  );

  /**
   * Get a list of the models in the user's dir.
   */
  const models = (await readdir(modelsDirectory)).filter(
    // Must be a TS file and start with a capital letter
    (file) => file.endsWith(".ts") && /^[A-Z]/.test(file)
  );

  /**
   * Iterate through the models and import them.
   */
  for (const modelFileName of models) {
    const module = require(`${modelsDirectory}/${modelFileName}`);
    const model = modelFileName.replace(".ts", "");

    /**
     * Assign it to the global context of the server.
     */
    server.context[model] = module[model];
  }

  server.displayPrompt();

  return server;
}
