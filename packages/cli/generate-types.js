/**
 * This script runs a PRAGMA query against `wrangler d1 execute <database>`
 * and converts the result into base TypeScript class definitions.
 */

const { execSync } = require("child_process");

// TODO: Read this from a config file or from `wrangler.toml`.
const database = "tweets-db";

const tablesQuery = `PRAGMA table_list`;

// TODO: Query DB directly instead of invoking via CLI.
const tablesResult = execSync(
  `NO_D1_WARNING=true npx wrangler d1 execute ${database} --command "${tablesQuery}"`,
  { encoding: "utf8" }
);

const tablesData = JSON.parse(getJSONFromCliResult(tablesResult));

console.log(tablesData[0].results);

function getJSONFromCliResult(cliResult) {
  console.log(cliResult);
  const lines = cliResult.split("\n");
  const start = lines.findIndex((line) => line.includes("Executed 1 command"));
  return lines.slice(start + 1).join("\n");
}
