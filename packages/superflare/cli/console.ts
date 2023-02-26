import { start } from "node:repl";
import { readdir } from "node:fs/promises";
import { register } from "esbuild-register/dist/node";
import { createD1Database } from "./d1-database";
import Database from "better-sqlite3";
import { homedir } from "node:os";
import { inspect } from "node:util";

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
  const db = createD1Database(new Database(dbPath));
  server.context["db"] = db;

  /**
   * Run the Superflare `config` to ensure Models have access to the database.
   */
  server.eval(
    `const {config} = require('superflare'); config({database: { default: db }});`,
    server.context,
    "repl",
    () => {}
  );

  /**
   * Get a list of the models in the user's dir.
   */
  const models = await readdir(modelsDirectory);

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
