import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import { FocusTimer, formatRemaining } from "../components/FocusTimer";

describe("FocusTimer", () => {
  const withFakeTimers = (run: () => void) => {
    vi.useFakeTimers();
    try {
      run();
    } finally {
      vi.useRealTimers();
    }
  };

  it("formats remaining time as m:ss", () => {
    expect(formatRemaining(65000)).toBe("1:05");
    expect(formatRemaining(0)).toBe("0:00");
  });

  it("opens the setup panel from the Timer button", () => {
    render(<FocusTimer />);
    fireEvent.click(screen.getByRole("button", { name: "Timer" }));
    expect(screen.getByRole("dialog", { name: "Focus timer" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start" })).toBeTruthy();
  });

  it("starts a countdown after selecting a preset and Start", () => {
    withFakeTimers(() => {
      render(<FocusTimer />);
      fireEvent.click(screen.getByRole("button", { name: "Timer" }));
      fireEvent.click(screen.getByRole("button", { name: "1m" }));
      fireEvent.click(screen.getByRole("button", { name: "Start" }));

      expect(screen.getByTestId("focus-timer-badge")).toBeTruthy();
      expect(screen.getByTestId("focus-timer-remaining").textContent).toBe(
        "1:00",
      );

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByTestId("focus-timer-remaining").textContent).toBe(
        "0:55",
      );
    });
  });

  it("pauses and resumes the countdown", () => {
    withFakeTimers(() => {
      render(<FocusTimer />);
      fireEvent.click(screen.getByRole("button", { name: "Timer" }));
      fireEvent.click(screen.getByRole("button", { name: "1m" }));
      fireEvent.click(screen.getByRole("button", { name: "Start" }));

      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(screen.getByTestId("focus-timer-remaining").textContent).toBe(
        "0:50",
      );

      fireEvent.click(screen.getByRole("button", { name: "Pause" }));

      act(() => {
        vi.advanceTimersByTime(60000);
      });
      expect(screen.getByTestId("focus-timer-remaining").textContent).toBe(
        "0:50",
      );

      fireEvent.click(screen.getByRole("button", { name: "Resume" }));

      act(() => {
        vi.advanceTimersByTime(50000);
      });
      expect(screen.getByTestId("focus-timer-remaining").textContent).toBe(
        "0:00",
      );
      expect(screen.getByTestId("focus-timer-badge").className).toContain(
        "focus-timer__badge--expired",
      );
    });
  });

  it("resets back to idle", () => {
    render(<FocusTimer />);
    fireEvent.click(screen.getByRole("button", { name: "Timer" }));
    fireEvent.click(screen.getByRole("button", { name: "5m" }));
    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.queryByTestId("focus-timer-badge")).toBeNull();
    expect(screen.getByRole("button", { name: "Timer" })).toBeTruthy();
  });

  it("shows expiry indication and toast when time runs out", () => {
    withFakeTimers(() => {
      const setToast = vi.fn();
      render(
        <FocusTimer
          excalidrawAPI={
            { setToast } as unknown as ExcalidrawImperativeAPI
          }
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Timer" }));
      fireEvent.click(screen.getByRole("button", { name: "1m" }));
      fireEvent.click(screen.getByRole("button", { name: "Start" }));

      act(() => {
        vi.advanceTimersByTime(60_000);
      });

      expect(screen.getByTestId("focus-timer-badge").className).toContain(
        "focus-timer__badge--expired",
      );
      expect(setToast).toHaveBeenCalledWith({ message: "Time's up!" });
    });
  });

  it("renders only one timer widget at a time", () => {
    render(<FocusTimer />);
    expect(screen.getAllByTestId("focus-timer")).toHaveLength(1);
  });
});
