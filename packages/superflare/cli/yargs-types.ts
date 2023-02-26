// Borrowed from: https://github.com/OnlineOrNot/onlineornot/blob/02894d76b04f524cbc2677510ee676145d420d53/packages/onlineornot/src/yargs-types.ts#L6

import type { ArgumentsCamelCase, Argv, CamelCaseKey } from "yargs";

/**
 * Yargs options included in every onlineornot command.
 */
export interface CommonYargsOptions {
  v: boolean | undefined;
}

export type CommonYargsArgv = Argv<CommonYargsOptions>;

export type YargvToInterface<T> = T extends Argv<infer P>
  ? ArgumentsCamelCase<P>
  : never;

// See http://stackoverflow.com/questions/51465182/how-to-remove-index-signature-using-mapped-types
type RemoveIndex<T> = {
  [K in keyof T as string extends K
    ? never
    : number extends K
    ? never
    : K]: T[K];
};

/**
 * Given some Yargs Options function factory, extract the interface
 * that corresponds to the yargs arguments, remove index types, and only allow camelCase
 */
export type StrictYargsOptionsToInterface<
  T extends (yargs: CommonYargsArgv) => Argv
> = T extends (yargs: CommonYargsArgv) => Argv<infer P>
  ? OnlyCamelCase<RemoveIndex<ArgumentsCamelCase<P>>>
  : never;

type OnlyCamelCase<T = Record<string, never>> = {
  [key in keyof T as CamelCaseKey<key>]: T[key];
};
