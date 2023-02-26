import { CommonYargsArgv } from "../yargs-types";
import { seedOptions, seedHandler } from "./seed";

export function db(yargs: CommonYargsArgv) {
  return yargs.command(
    "seed",
    "🌱  Seed your database with data",
    seedOptions,
    seedHandler
  );
}
