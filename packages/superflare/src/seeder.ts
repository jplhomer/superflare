import { setConfig } from "./config";

export function seed(callback: () => void) {
  return (database: D1Database) => {
    setConfig({ database: { default: database } });
    callback();
  };
}
