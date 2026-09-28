/**
 * Local workshop countdown timer for facilitators — presets, pause/resume,
 * and a persistent mm:ss badge that does not block canvas editing.
 */
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import "./FocusTimer.scss";

const PRESET_MINUTES = [1, 5, 10, 15] as const;
const TICK_MS = 250;

export type TimerPhase = "idle" | "running" | "paused" | "expired";

/** Formats milliseconds as m:ss for the running badge. */
export const formatRemaining = (remainingMs: number): string => {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const minutesToMs = (minutes: number) => minutes * 60 * 1000;

export type FocusTimerProps = {
  excalidrawAPI?: ExcalidrawImperativeAPI | null;
};

export const FocusTimer = ({ excalidrawAPI }: FocusTimerProps) => {
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(1);
  const [customMinutes, setCustomMinutes] = useState("");
  const [endTime, setEndTime] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const expiryToastShown = useRef(false);

  const resolveDurationMs = useCallback((): number | null => {
    const parsedCustom = parseInt(customMinutes, 10);
    if (customMinutes.trim() !== "" && !Number.isNaN(parsedCustom)) {
      if (parsedCustom <= 0) {
        return null;
      }
      return minutesToMs(parsedCustom);
    }
    return minutesToMs(selectedMinutes);
  }, [customMinutes, selectedMinutes]);

  const resetTimer = useCallback(() => {
    setPhase("idle");
    setEndTime(null);
    setRemainingMs(0);
    setPanelOpen(false);
    expiryToastShown.current = false;
  }, []);

  const startTimer = useCallback(() => {
    const durationMs = resolveDurationMs();
    if (durationMs == null) {
      return;
    }
    setEndTime(Date.now() + durationMs);
    setRemainingMs(durationMs);
    setPhase("running");
    setPanelOpen(false);
    expiryToastShown.current = false;
  }, [resolveDurationMs]);

  const pauseTimer = useCallback(() => {
    if (endTime == null) {
      return;
    }
    setRemainingMs(Math.max(0, endTime - Date.now()));
    setEndTime(null);
    setPhase("paused");
  }, [endTime]);

  const resumeTimer = useCallback(() => {
    if (remainingMs <= 0) {
      return;
    }
    setEndTime(Date.now() + remainingMs);
    setPhase("running");
  }, [remainingMs]);

  // Timestamp-based tick while running; survives brief tab backgrounding.
  useEffect(() => {
    if (phase !== "running" || endTime == null) {
      return;
    }

    const tick = () => {
      const nextRemaining = endTime - Date.now();
      if (nextRemaining <= 0) {
        setRemainingMs(0);
        setEndTime(null);
        setPhase("expired");
        if (!expiryToastShown.current) {
          expiryToastShown.current = true;
          excalidrawAPI?.setToast({ message: "Time's up!" });
        }
        return;
      }
      setRemainingMs(nextRemaining);
    };

    tick();
    const intervalId = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(intervalId);
  }, [phase, endTime, excalidrawAPI]);

  const showActiveBadge =
    phase === "running" || phase === "paused" || phase === "expired";

  return (
    <div className="focus-timer" data-testid="focus-timer">
      {phase === "idle" && (
        <>
          <button
            type="button"
            className="focus-timer__toggle"
            aria-expanded={panelOpen}
            aria-haspopup="dialog"
            onClick={() => setPanelOpen((open) => !open)}
          >
            Timer
          </button>
          {panelOpen && (
            <div className="focus-timer__panel" role="dialog" aria-label="Focus timer">
              <div className="focus-timer__presets">
                {PRESET_MINUTES.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    className={clsx("focus-timer__preset", {
                      "focus-timer__preset--selected":
                        customMinutes.trim() === "" &&
                        selectedMinutes === minutes,
                    })}
                    onClick={() => {
                      setSelectedMinutes(minutes);
                      setCustomMinutes("");
                    }}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
              <div className="focus-timer__custom-row">
                <label htmlFor="focus-timer-custom">Custom (min)</label>
                <input
                  id="focus-timer-custom"
                  type="number"
                  min={1}
                  value={customMinutes}
                  onChange={(event) => setCustomMinutes(event.target.value)}
                />
              </div>
              <button
                type="button"
                className="focus-timer__start"
                disabled={resolveDurationMs() == null}
                onClick={startTimer}
              >
                Start
              </button>
            </div>
          )}
        </>
      )}

      {showActiveBadge && (
        <div
          className={clsx("focus-timer__badge", {
            "focus-timer__badge--expired": phase === "expired",
          })}
          data-testid="focus-timer-badge"
        >
          <span className="focus-timer__time" data-testid="focus-timer-remaining">
            {formatRemaining(remainingMs)}
          </span>
          {phase === "running" && (
            <button
              type="button"
              className="focus-timer__control"
              onClick={pauseTimer}
            >
              Pause
            </button>
          )}
          {phase === "paused" && (
            <button
              type="button"
              className="focus-timer__control"
              onClick={resumeTimer}
            >
              Resume
            </button>
          )}
          <button
            type="button"
            className="focus-timer__control"
            onClick={resetTimer}
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
};
