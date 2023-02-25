import { config } from "./config";

export function seed(callback: () => void) {
  return (database: D1Database) => {
    config({ database: { default: database } });
    callback();
  };
}
