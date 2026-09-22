/** Local workshop countdown in the top-right UI; does not sync or touch canvas state. */
import clsx from "clsx";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { useUIAppState } from "../context/ui-appState";
import { t } from "../i18n";

import { Island } from "./Island";
import { Popover } from "./Popover";
import { timerIcon } from "./icons";

import "./FocusTimer.scss";

const PRESET_MINUTES = [1, 5, 10, 15] as const;
const TICK_MS = 250;
const PANEL_WIDTH = 240;
const DEFAULT_MINUTES = 1;
const MIN_CUSTOM_MINUTES = 1;
const MAX_CUSTOM_MINUTES = 120;

type TimerStatus = "idle" | "running" | "paused" | "expired";

const minutesToMs = (minutes: number) => minutes * 60 * 1000;

export const formatRemainingMs = (ms: number): string => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export const FocusTimer = () => {
  const appState = useUIAppState();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [durationMs, setDurationMs] = useState(minutesToMs(DEFAULT_MINUTES));
  const [remainingMs, setRemainingMs] = useState(minutesToMs(DEFAULT_MINUTES));
  const [selectedPresetMinutes, setSelectedPresetMinutes] = useState<
    number | null
  >(DEFAULT_MINUTES);
  const [customMinutes, setCustomMinutes] = useState("");
  const [popoverPos, setPopoverPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const anchorRef = useRef<HTMLDivElement>(null);
  const endTimeRef = useRef(0);

  const canEditDuration = status === "idle" || status === "paused";

  useLayoutEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPopoverPos({
        top: rect.bottom + 8,
        left: Math.max(8, rect.right - PANEL_WIDTH),
      });
    }
  }, [open]);

  useEffect(() => {
    if (status !== "running") {
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, endTimeRef.current - Date.now());
      setRemainingMs(remaining);
      if (remaining <= 0) {
        setStatus("expired");
      }
    };

    tick();
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, [status]);

  const applyDuration = useCallback((minutes: number) => {
    const ms = minutesToMs(minutes);
    setDurationMs(ms);
    setRemainingMs(ms);
    setSelectedPresetMinutes(
      PRESET_MINUTES.includes(minutes as (typeof PRESET_MINUTES)[number])
        ? minutes
        : null,
    );
  }, []);

  const handlePreset = (minutes: number) => {
    if (!canEditDuration) {
      return;
    }
    setCustomMinutes("");
    applyDuration(minutes);
  };

  const handleCustomChange = (value: string) => {
    if (!canEditDuration) {
      return;
    }
    setCustomMinutes(value);
    const parsed = Number.parseInt(value, 10);
    if (
      Number.isFinite(parsed) &&
      parsed >= MIN_CUSTOM_MINUTES &&
      parsed <= MAX_CUSTOM_MINUTES
    ) {
      applyDuration(parsed);
    }
  };

  const handleStart = () => {
    if (remainingMs <= 0) {
      return;
    }
    endTimeRef.current = Date.now() + remainingMs;
    setStatus("running");
  };

  const handlePause = () => {
    if (status !== "running") {
      return;
    }
    const remaining = Math.max(0, endTimeRef.current - Date.now());
    setRemainingMs(remaining);
    setStatus("paused");
  };

  const handleResume = () => {
    if (status !== "paused" || remainingMs <= 0) {
      return;
    }
    endTimeRef.current = Date.now() + remainingMs;
    setStatus("running");
  };

  const handleReset = () => {
    endTimeRef.current = 0;
    setStatus("idle");
    setRemainingMs(durationMs);
  };

  const handleClose = useCallback(() => setOpen(false), []);

  const triggerLabel =
    status === "expired"
      ? t("timer.timesUp")
      : status === "running" || status === "paused"
      ? formatRemainingMs(remainingMs)
      : t("timer.button");

  return (
    <div className="FocusTimer" ref={anchorRef}>
      <button
        type="button"
        className={clsx("FocusTimer__trigger", {
          active: open,
          "FocusTimer__trigger--running":
            status === "running" || status === "paused",
          "FocusTimer__trigger--expired": status === "expired",
        })}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("timer.title")}
        data-testid="focus-timer-trigger"
      >
        <span className="FocusTimer__icon" aria-hidden>
          {timerIcon}
        </span>
        {triggerLabel}
      </button>
      {open && popoverPos && (
        <Popover
          top={popoverPos.top}
          left={popoverPos.left}
          fitInViewport
          offsetLeft={appState.offsetLeft}
          offsetTop={appState.offsetTop}
          viewportWidth={appState.width}
          viewportHeight={appState.height}
          onCloseRequest={handleClose}
          className="FocusTimer__popover"
        >
          <Island padding={2} className="FocusTimer__panel">
            <div className="FocusTimer__title">{t("timer.title")}</div>
            <div
              className={clsx("FocusTimer__countdown", {
                "FocusTimer__countdown--expired": status === "expired",
              })}
              aria-live="polite"
              aria-label={t("timer.remaining")}
              data-testid="focus-timer-display"
            >
              {status === "expired"
                ? t("timer.timesUp")
                : formatRemainingMs(remainingMs)}
            </div>
            <div className="FocusTimer__presets">
              {PRESET_MINUTES.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={clsx("FocusTimer__preset", {
                    selected: selectedPresetMinutes === minutes,
                  })}
                  disabled={!canEditDuration}
                  onClick={() => handlePreset(minutes)}
                  data-testid={`focus-timer-preset-${minutes}`}
                >
                  {minutes}m
                </button>
              ))}
            </div>
            <label className="FocusTimer__custom">
              {t("timer.customMinutes")}
              <input
                type="number"
                min={MIN_CUSTOM_MINUTES}
                max={MAX_CUSTOM_MINUTES}
                value={customMinutes}
                disabled={!canEditDuration}
                onChange={(event) => handleCustomChange(event.target.value)}
                data-testid="focus-timer-custom"
              />
            </label>
            <div className="FocusTimer__controls">
              {status === "idle" || status === "expired" ? (
                <button
                  type="button"
                  className="FocusTimer__control"
                  onClick={handleStart}
                  data-testid="focus-timer-start"
                >
                  {t("timer.start")}
                </button>
              ) : status === "running" ? (
                <button
                  type="button"
                  className="FocusTimer__control"
                  onClick={handlePause}
                  data-testid="focus-timer-pause"
                >
                  {t("timer.pause")}
                </button>
              ) : (
                <button
                  type="button"
                  className="FocusTimer__control"
                  onClick={handleResume}
                  data-testid="focus-timer-resume"
                >
                  {t("timer.resume")}
                </button>
              )}
              <button
                type="button"
                className="FocusTimer__control"
                onClick={handleReset}
                data-testid="focus-timer-reset"
              >
                {t("timer.reset")}
              </button>
            </div>
          </Island>
        </Popover>
      )}
    </div>
  );
};
