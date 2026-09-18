// Unit tests for laser-pointer polyline helpers used by LaserPointer.addPoint.
import { dist, runLength } from "../src/math";

import type { Point } from "../src/math";

describe("runLength", () => {
  it("returns 0 for empty or single-point paths", () => {
    expect(runLength([])).toBe(0);
    expect(runLength([[0, 0, 1]])).toBe(0);
  });

  it("returns the single segment length for two points", () => {
    const a: Point = [0, 0, 1];
    const b: Point = [3, 4, 1];
    expect(runLength([a, b])).toBe(dist(a, b));
    expect(runLength([a, b])).toBe(5);
  });

  it("sums consecutive segments without double-counting the last one", () => {
    const a: Point = [0, 0, 1];
    const b: Point = [10, 0, 1];
    const c: Point = [10, 20, 1];
    // 10 + 20 = 30; previously the final segment was added twice (→ 50).
    expect(runLength([a, b, c])).toBe(30);
    expect(runLength([a, b, c])).toBe(dist(a, b) + dist(b, c));
  });
});
