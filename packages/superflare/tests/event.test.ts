import { describe, expect, it } from "vitest";
import { channelNameToConfigName } from "../src/event";

describe("channelNameToConfigName", () => {
  it("works with a single replacement", () => {
    expect(channelNameToConfigName("foo.bar", ["foo.*"])).toBe("foo.*");
  });

  it("works with multiple replacements", () => {
    expect(
      channelNameToConfigName("foo.bar.baz", ["foo.*.*", "foo.bing.*"])
    ).toBe("foo.*.*");
  });

  it("works with multiple segments", () => {
    expect(
      channelNameToConfigName("foo.bar.baz", ["foo.bar.*", "foo.bing.*"])
    ).toBe("foo.bar.*");
  });

  it("chooses the exact match over a regex", () => {
    expect(channelNameToConfigName("foo.bar", ["foo.*", "foo.bar"])).toBe(
      "foo.bar"
    );
  });

  it("chooses the most specific match by number of dots", () => {
    expect(channelNameToConfigName("foo.bar.baz", ["foo.*", "foo.bar.*"])).toBe(
      "foo.bar.*"
    );
  });
});
