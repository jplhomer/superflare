import bcrypt from "bcryptjs";

export function hash() {
  return {
    async make(input: string) {
      return await bcrypt.hash(input, 10);
    },

    async check(input: string, hash: string) {
      return await bcrypt.compare(input, hash);
    },
  };
}
