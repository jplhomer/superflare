import { getContextFromUserConfig, runWithContext } from "./context";

export function seed(callback: () => void) {
  return (database: D1Database) =>
    runWithContext(
      getContextFromUserConfig({ database: { default: database } }),
      async () => {
        return callback();
      }
    );
}
