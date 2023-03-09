import { describe, expect, test, vi } from "vitest";
import { handleWebSockets } from "../src/websockets";

describe("handleWebSockets", () => {
  test("should throw if no proper channel name supplied", async () => {
    const request = new Request("https://example.com/channels");

    await expect(handleWebSockets(request)).rejects.toThrowError(
      `No channel binding found for "channels". Please update your superflare.config.`
    );
  });
});
