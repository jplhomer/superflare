import path from "path";

interface SuperflarePackageJsonConfig {
  d1?: string;
  r2?: string;
}

export async function getSuperflareConfigFromPackageJson(
  workingDir: string
): Promise<SuperflarePackageJsonConfig | null> {
  try {
    const pkg = await import(path.join(workingDir, "package.json"));
    return pkg.superflare;
  } catch (e: any) {
    return null;
  }
}
