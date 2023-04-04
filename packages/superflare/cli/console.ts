import { start } from "node:repl";
import { readdir } from "node:fs/promises";
import { register } from "esbuild-register/dist/node";
import { homedir } from "node:os";
import { inspect } from "node:util";
import path from "node:path";
import { CommonYargsArgv, StrictYargsOptionsToInterface } from "./yargs-types";
import { createD1Database } from "./d1-database";
import { Script } from "node:vm";

export function consoleOptions(yargs: CommonYargsArgv) {
  return yargs
    .option("db", {
      alias: "d",
      describe: "Path to the database",

      // Default to the path in the .wrangler directory
      default: path.join(
        process.cwd(),
        ".wrangler",
        "state",
        "d1",
        "DB.sqlite3"
      ),
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
  const dbPath = argv.db;

  return createRepl({ modelsDirectory, dbPath });
}

export async function createRepl({
  modelsDirectory,
  dbPath,
}: {
  modelsDirectory: string;
  dbPath: string;
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
  const db = await createD1Database(dbPath);
  server.context["db"] = db;

  /**
   * Define a custom `eval` function to wrap the code in a `runWithContext` call.
   */
  const customEval = (
    cmd: string,
    _: any,
    filename: string,
    callback: (err: Error | null, result: any) => void
  ) => {
    const wrappedCmd = `
      const { getContextFromUserConfig, runWithContext } = require('superflare');
      const context = getContextFromUserConfig({database: { default: db }});
      runWithContext(context, async () => {
        return ${cmd}
      });
    `;

    const response = new Script(wrappedCmd, { filename }).runInThisContext();

    if (response instanceof Promise) {
      response
        .then((result) => callback(null, result))
        .catch((err) => callback(err, null));
    } else {
      callback(null, response);
    }
  };

  // @ts-ignore
  server["eval"] = customEval;

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
