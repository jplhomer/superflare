import { format } from "node:util";
import CLITable from "cli-table3";
import chalk from "chalk";

export const LOGGER_LEVELS = {
  none: -1,
  error: 0,
  warn: 1,
  info: 2,
  log: 3,
  debug: 4,
} as const;

export type LoggerLevel = keyof typeof LOGGER_LEVELS;
export type TableRow<Keys extends string> = Record<Keys, string>;

/**
 * Inspired by wrangler's `Logger` class
 * @see https://github.com/cloudflare/wrangler2/blob/6b6ce5060a12e94a59c76249bb8022ea2737c5f7/packages/wrangler/src/logger.ts#L45
 */
class Logger {
  debug = (...args: unknown[]) => this.doLog("debug", args);
  info = (...args: unknown[]) => this.doLog("info", args);
  log = (...args: unknown[]) => this.doLog("log", args);
  warn = (...args: unknown[]) => this.doLog("warn", args);
  error = (...args: unknown[]) => this.doLog("error", args);

  table<Keys extends string>(data: TableRow<Keys>[]) {
    const keys: Keys[] =
      data.length === 0 ? [] : (Object.keys(data[0]) as Keys[]);
    const t = new CLITable({
      head: keys.map((k) => chalk.bold.blue(k)),
    });
    t.push(...data.map((row) => keys.map((k) => row[k])));
    return this.doLog("log", [t.toString()]);
  }

  private doLog(messageLevel: Exclude<LoggerLevel, "none">, args: unknown[]) {
    console[messageLevel](format(...args));
  }
}

export const logger = new Logger();
