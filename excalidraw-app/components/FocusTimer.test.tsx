import { describe, expect, it } from "vitest";

import { formatTime } from "./FocusTimer";

describe("formatTime", () => {
  it("formats zero as 00:00", () => {
    expect(formatTime(0)).toBe("00:00");
  });

  it("formats sub-minute durations with seconds only", () => {
    expect(formatTime(45_000)).toBe("00:45");
  });

  it("formats minutes and seconds", () => {
    expect(formatTime(125_000)).toBe("02:05");
  });

  it("ceil partial seconds so 999ms shows one second", () => {
    expect(formatTime(999)).toBe("00:01");
  });

  it("clamps negative values to 00:00", () => {
    expect(formatTime(-500)).toBe("00:00");
  });
});
