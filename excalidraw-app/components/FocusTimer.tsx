/** Workshop countdown timer: presets, custom duration, and start/pause/reset; local state only. */
import { Island } from "@excalidraw/excalidraw/components/Island";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";

import "./FocusTimer.scss";

const PRESET_MINUTES = [1, 5, 10, 15] as const;
const TICK_MS = 250;
const DEFAULT_MINUTES = 5;
const MS_PER_MINUTE = 60_000;

export type TimerStatus = "idle" | "running" | "paused" | "expired";

/** Formats milliseconds as MM:SS for the countdown display. */
export const formatTime = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
};

const isTimerToggle = (event: KeyboardEvent) =>
  event.code === "KeyT" &&
  event.shiftKey &&
  (event.metaKey || event.ctrlKey);

const minutesToMs = (minutes: number) => minutes * MS_PER_MINUTE;

export const FocusTimer = () => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const endTimeRef = useRef<number | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [durationMs, setDurationMs] = useState(minutesToMs(DEFAULT_MINUTES));
  const [remainingMs, setRemainingMs] = useState(minutesToMs(DEFAULT_MINUTES));
  const [customMinutes, setCustomMinutes] = useState(String(DEFAULT_MINUTES));

  const canEditDuration = status === "idle" || status === "expired";

  const togglePanel = useCallback(() => {
    setPanelOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTimerToggle(event) || isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
      togglePanel();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePanel]);

  useEffect(() => {
    if (status !== "running") {
      return;
    }

    const tick = () => {
      const end = endTimeRef.current;
      if (end == null) {
        return;
      }
      const left = end - Date.now();
      if (left <= 0) {
        setRemainingMs(0);
        setStatus("expired");
        endTimeRef.current = null;
        return;
      }
      setRemainingMs(left);
    };

    tick();
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, [status]);

  const applyPreset = (minutes: number) => {
    if (!canEditDuration) {
      return;
    }
    const ms = minutesToMs(minutes);
    setDurationMs(ms);
    setRemainingMs(ms);
    setCustomMinutes(String(minutes));
  };

  const onCustomMinutesChange = (value: string) => {
    setCustomMinutes(value);
    if (!canEditDuration) {
      return;
    }
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return;
    }
    const capped = Math.min(parsed, 999);
    const ms = minutesToMs(capped);
    setDurationMs(ms);
    setRemainingMs(ms);
  };

  const start = () => {
    const ms = remainingMs > 0 ? remainingMs : durationMs;
    endTimeRef.current = Date.now() + ms;
    setRemainingMs(ms);
    setStatus("running");
  };

  const pause = () => {
    if (endTimeRef.current != null) {
      setRemainingMs(Math.max(0, endTimeRef.current - Date.now()));
    }
    endTimeRef.current = null;
    setStatus("paused");
  };

  const resume = () => {
    endTimeRef.current = Date.now() + remainingMs;
    setStatus("running");
  };

  const reset = () => {
    endTimeRef.current = null;
    setStatus("idle");
    setRemainingMs(durationMs);
  };

  const closePanel = () => setPanelOpen(false);

  return (
    <div className="FocusTimer" ref={anchorRef}>
      <button
        type="button"
        className={clsx("FocusTimer__button", {
          active: panelOpen || status === "running" || status === "paused",
          "FocusTimer__button--expired": status === "expired",
        })}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={togglePanel}
        aria-expanded={panelOpen}
        aria-haspopup="dialog"
      >
        ⏱ Timer
      </button>

      <div className="FocusTimer__live" aria-live="polite" aria-atomic="true">
        {status === "expired" ? "Time's up" : ""}
      </div>

      {panelOpen && (
        <div className="FocusTimer__panel-wrap" role="dialog" aria-label="Focus timer">
        <Island padding={2} className="FocusTimer__panel">
          <div className="FocusTimer__title">Focus timer</div>

          <div
            className={clsx("FocusTimer__display", {
              "FocusTimer__display--expired": status === "expired",
            })}
          >
            {formatTime(remainingMs)}
          </div>

          <div className="FocusTimer__presets">
            {PRESET_MINUTES.map((minutes) => (
              <button
                key={minutes}
                type="button"
                className={clsx("FocusTimer__preset", {
                  selected: durationMs === minutesToMs(minutes) && canEditDuration,
                })}
                disabled={!canEditDuration}
                onClick={() => applyPreset(minutes)}
              >
                {minutes}m
              </button>
            ))}
          </div>

          <label className="FocusTimer__custom">
            <span className="FocusTimer__custom-label">Custom (minutes)</span>
            <input
              type="number"
              min={1}
              max={999}
              value={customMinutes}
              disabled={!canEditDuration}
              onChange={(event) => onCustomMinutesChange(event.target.value)}
              onPointerDown={(event) => event.stopPropagation()}
            />
          </label>

          <div className="FocusTimer__controls">
            {(status === "idle" || status === "expired") && (
              <button type="button" className="FocusTimer__control primary" onClick={start}>
                Start
              </button>
            )}
            {status === "running" && (
              <button type="button" className="FocusTimer__control" onClick={pause}>
                Pause
              </button>
            )}
            {status === "paused" && (
              <button type="button" className="FocusTimer__control primary" onClick={resume}>
                Resume
              </button>
            )}
            {status !== "idle" && (
              <button type="button" className="FocusTimer__control" onClick={reset}>
                Reset
              </button>
            )}
            <button type="button" className="FocusTimer__control" onClick={closePanel}>
              Close
            </button>
          </div>
        </Island>
        </div>
      )}
    </div>
  );
};
