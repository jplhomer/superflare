export function job(name: string) {
  return `import { Job, registerJob } from "superflare";

export class ${name} extends Job {
  constructor() {
    super();
  }

  async handle(): Promise<void> {
    // Handle the job
  }
}

registerJob(${name});
`;
}
