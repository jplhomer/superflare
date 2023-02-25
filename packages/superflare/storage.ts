import { Config } from "./config";

export function storage(disk?: string) {
  if (!Config.storage?.disks) {
    throw new Error(
      "No Storage disks configured. Please assign an R2 bucket in your config file."
    );
  }

  const bucket = disk
    ? Config.storage?.disks[disk]
    : Config.storage?.disks?.default;

  if (!bucket) {
    throw new Error(`R2 bucket "${disk}" could not be found.`);
  }

  return bucket;
}
