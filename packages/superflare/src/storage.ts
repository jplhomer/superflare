import { StorageDiskConfig } from "./config";
import { getStorage } from "./context";

export function storage(disk?: string) {
  const storage = getStorage();
  if (!storage?.disks) {
    throw new Error(
      "No Storage disks configured. Please assign an R2 bucket in your config file."
    );
  }

  const diskToUse = disk
    ? storage.disks?.[disk as keyof typeof storage]
    : storage.disks?.default;

  if (!diskToUse || !diskToUse.binding) {
    throw new Error(`R2 bucket "${disk}" could not be found.`);
  }

  const diskName = disk || "default";

  return new Storage(diskName, diskToUse);
}

class Storage {
  constructor(public diskName: string, public disk: StorageDiskConfig) {}

  url(key: string) {
    if (this.disk.publicPath) {
      return `${this.disk.publicPath}/${key}`;
    }

    return null;
  }

  get(key: string) {
    return this.disk.binding.get(key);
  }

  delete(key: string) {
    return this.disk.binding.delete(key);
  }

  put(file: File) {
    const extension = file.name.split(".").pop();
    const hash = crypto.randomUUID();
    let key = hash;
    if (extension) {
      key += `.${extension}`;
    }

    return this.disk.binding.put(key, file);
  }

  putAs(...args: Parameters<R2Bucket["put"]>) {
    return this.disk.binding.put(...args);
  }
}

export async function servePublicPathFromStorage(path: string) {
  const notFoundResponse = new Response("Not found", { status: 404 });

  const storageConfig = getStorage();
  if (!storageConfig?.disks) {
    return notFoundResponse;
  }

  const matchingDiskName = Object.keys(storageConfig.disks).find((diskName) => {
    const { publicPath } = storageConfig.disks![diskName];
    return publicPath && path.startsWith(publicPath);
  });

  if (!matchingDiskName) {
    return notFoundResponse;
  }

  const key = path
    .replace(storageConfig.disks[matchingDiskName].publicPath!, "")
    .replace(/^\//, "");

  const object = await storage(matchingDiskName).get(key);

  if (!object) {
    return notFoundResponse;
  }

  return new Response(object.body, {
    headers: {
      // TODO: Infer content type from file extension
      // 'Content-Type': file.type,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
