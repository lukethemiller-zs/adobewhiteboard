import { vi } from "vitest";

import { Excalidraw } from "../index";

import { act, fireEvent, render, screen } from "./test-utils";

describe("FocusTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts down, pauses, resumes, and expires", async () => {
    await render(<Excalidraw />);

    fireEvent.click(screen.getByTestId("focus-timer-trigger"));
    fireEvent.click(screen.getByTestId("focus-timer-preset-1"));
    fireEvent.click(screen.getByTestId("focus-timer-start"));

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByTestId("focus-timer-trigger")).toHaveTextContent("0:30");
    expect(screen.getByTestId("focus-timer-display")).toHaveTextContent("0:30");

    fireEvent.click(screen.getByTestId("focus-timer-pause"));

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(screen.getByTestId("focus-timer-display")).toHaveTextContent("0:30");

    fireEvent.click(screen.getByTestId("focus-timer-resume"));

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByTestId("focus-timer-display")).toHaveTextContent(
      "Time's up",
    );
    expect(screen.getByTestId("focus-timer-trigger")).toHaveTextContent(
      "Time's up",
    );
  });

  it("resets to idle with the selected duration", async () => {
    await render(<Excalidraw />);

    fireEvent.click(screen.getByTestId("focus-timer-trigger"));
    fireEvent.click(screen.getByTestId("focus-timer-preset-5"));
    fireEvent.click(screen.getByTestId("focus-timer-start"));

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByTestId("focus-timer-display")).toHaveTextContent("4:00");

    fireEvent.click(screen.getByTestId("focus-timer-reset"));

    expect(screen.getByTestId("focus-timer-trigger")).toHaveTextContent("Timer");
    expect(screen.getByTestId("focus-timer-display")).toHaveTextContent("5:00");
    expect(screen.getByTestId("focus-timer-start")).toBeInTheDocument();
  });
});
