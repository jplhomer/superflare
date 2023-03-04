export function jobTemplate(name: string) {
  return `import { Job } from "superflare";

export class ${name} extends Job {
  constructor() {
    super();
  }

  async handle(): Promise<void> {
    // Handle the job
  }
}

Job.register(${name});
`;
}
