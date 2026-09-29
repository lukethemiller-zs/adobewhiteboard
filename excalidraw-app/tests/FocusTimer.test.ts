import { describe, expect, it } from "vitest";

import {
  formatRemaining,
  initialTimerState,
  reduceTimerState,
} from "../components/FocusTimer";

describe("formatRemaining", () => {
  it("formats minutes and seconds with zero padding", () => {
    expect(formatRemaining(90_000)).toBe("01:30");
    expect(formatRemaining(65_000)).toBe("01:05");
    expect(formatRemaining(0)).toBe("00:00");
  });

  it("ceilings partial seconds", () => {
    expect(formatRemaining(1001)).toBe("00:02");
  });
});

describe("reduceTimerState", () => {
  const t0 = 1_000_000;

  it("starts from idle with selected duration", () => {
    const idle = reduceTimerState(initialTimerState, {
      type: "selectDuration",
      durationMs: 5 * 60_000,
    });
    const running = reduceTimerState(idle, { type: "start", now: t0 });
    expect(running.status).toBe("running");
    expect(running.endAt).toBe(t0 + 5 * 60_000);
    expect(running.remainingMs).toBe(5 * 60_000);
  });

  it("pauses and resumes without losing remaining time", () => {
    const running = reduceTimerState(
      { ...initialTimerState, durationMs: 60_000, remainingMs: 60_000 },
      { type: "start", now: t0 },
    );
    const paused = reduceTimerState(running, {
      type: "pause",
      now: t0 + 10_000,
    });
    expect(paused.status).toBe("paused");
    expect(paused.remainingMs).toBe(50_000);

    const resumed = reduceTimerState(paused, {
      type: "resume",
      now: t0 + 20_000,
    });
    expect(resumed.status).toBe("running");
    expect(resumed.endAt).toBe(t0 + 20_000 + 50_000);
  });

  it("expires on tick when time reaches zero", () => {
    const running = reduceTimerState(initialTimerState, {
      type: "start",
      now: t0,
      durationMs: 1000,
    });
    const expired = reduceTimerState(running, { type: "tick", now: t0 + 1000 });
    expect(expired.status).toBe("expired");
    expect(expired.remainingMs).toBe(0);
  });

  it("resets to idle with the same duration", () => {
    const running = reduceTimerState(initialTimerState, {
      type: "start",
      now: t0,
    });
    const reset = reduceTimerState(running, { type: "reset" });
    expect(reset.status).toBe("idle");
    expect(reset.remainingMs).toBe(reset.durationMs);
    expect(reset.endAt).toBeNull();
  });
});
