/**
 * Workshop focus timer overlay: single local countdown with presets and controls.
 */
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from "react";

export const PRESET_MINUTES = [1, 5, 10, 15] as const;

export type TimerStatus = "idle" | "running" | "paused" | "expired";

export type TimerState = {
  status: TimerStatus;
  /** Total duration for the current countdown session. */
  durationMs: number;
  /** Remaining time when idle (preview), paused, or expired (0). */
  remainingMs: number;
  /** Wall-clock end time while running. */
  endAt: number | null;
};

export type TimerAction =
  | { type: "selectDuration"; durationMs: number }
  | { type: "start"; now: number; durationMs?: number }
  | { type: "pause"; now: number }
  | { type: "resume"; now: number }
  | { type: "reset" }
  | { type: "tick"; now: number };

export const initialTimerState: TimerState = {
  status: "idle",
  durationMs: PRESET_MINUTES[0] * 60_000,
  remainingMs: PRESET_MINUTES[0] * 60_000,
  endAt: null,
};

/** Formats milliseconds as MM:SS for the countdown readout. */
export function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Pure state transitions for start, pause, resume, reset, and tick. */
export function reduceTimerState(
  state: TimerState,
  action: TimerAction,
): TimerState {
  switch (action.type) {
    case "selectDuration": {
      if (state.status === "running" || state.status === "paused") {
        return state;
      }
      const durationMs = Math.max(0, action.durationMs);
      return {
        ...state,
        status: "idle",
        durationMs,
        remainingMs: durationMs,
        endAt: null,
      };
    }
    case "start": {
      const durationMs = action.durationMs ?? state.durationMs;
      if (durationMs <= 0) {
        return state;
      }
      return {
        ...state,
        status: "running",
        durationMs,
        remainingMs: durationMs,
        endAt: action.now + durationMs,
      };
    }
    case "pause": {
      if (state.status !== "running" || state.endAt == null) {
        return state;
      }
      const remainingMs = Math.max(0, state.endAt - action.now);
      return {
        ...state,
        status: "paused",
        remainingMs,
        endAt: null,
      };
    }
    case "resume": {
      if (state.status !== "paused" || state.remainingMs <= 0) {
        return state;
      }
      return {
        ...state,
        status: "running",
        endAt: action.now + state.remainingMs,
      };
    }
    case "reset":
      return {
        status: "idle",
        durationMs: state.durationMs,
        remainingMs: state.durationMs,
        endAt: null,
      };
    case "tick": {
      if (state.status !== "running" || state.endAt == null) {
        return state;
      }
      const remainingMs = Math.max(0, state.endAt - action.now);
      if (remainingMs <= 0) {
        return {
          ...state,
          status: "expired",
          remainingMs: 0,
          endAt: null,
        };
      }
      return { ...state, remainingMs };
    }
    default:
      return state;
  }
}

function parseCustomMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

const TICK_MS = 250;

/** Top-right workshop countdown timer (local-only, single instance). */
export const FocusTimer = () => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [timer, dispatch] = useReducer(reduceTimerState, initialTimerState);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const displayRemainingMs =
    timer.status === "running" && timer.endAt != null
      ? Math.max(0, timer.endAt - Date.now())
      : timer.remainingMs;

  useEffect(() => {
    if (timer.status !== "running") {
      return;
    }
    const id = window.setInterval(() => {
      dispatch({ type: "tick", now: Date.now() });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [timer.status, timer.endAt]);

  useEffect(() => {
    if (panelOpen) {
      panelRef.current?.focus();
    }
  }, [panelOpen]);

  const selectPreset = useCallback((minutes: number) => {
    dispatch({ type: "selectDuration", durationMs: minutes * 60_000 });
    setCustomMinutes("");
  }, []);

  const applyCustomDuration = useCallback(() => {
    const minutes = parseCustomMinutes(customMinutes);
    if (minutes == null) {
      return;
    }
    dispatch({ type: "selectDuration", durationMs: minutes * 60_000 });
  }, [customMinutes]);

  const onStart = useCallback(() => {
    const now = Date.now();
    if (customMinutes.trim()) {
      const minutes = parseCustomMinutes(customMinutes);
      if (minutes == null) {
        return;
      }
      dispatch({
        type: "start",
        now,
        durationMs: minutes * 60_000,
      });
      return;
    }
    dispatch({ type: "start", now });
  }, [customMinutes]);

  const canStart =
    timer.status === "idle" &&
    (timer.durationMs > 0 ||
      parseCustomMinutes(customMinutes) != null);

  const isExpired = timer.status === "expired";

  return (
    <>
      <style>{`
        .focus-timer-toggle:hover {
          background: var(--color-surface-high, #f1f3f5);
        }
        .focus-timer-preset:focus-visible,
        .focus-timer-control:focus-visible,
        .focus-timer-toggle:focus-visible {
          outline: 2px solid var(--color-primary, #6965db);
          outline-offset: 2px;
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        <button
          ref={toggleRef}
          type="button"
          className="focus-timer-toggle"
          aria-label={panelOpen ? "Close timer panel" : "Open timer panel"}
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((open) => !open)}
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid var(--default-border-color, #ced4da)",
            background: "var(--island-bg-color, #fff)",
            boxShadow: "var(--shadow-island, 0 0 0 1px rgba(0,0,0,0.05))",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--text-primary-color, #1e1e1e)",
          }}
        >
          <span aria-hidden>⏱</span>
          Timer
        </button>

        {panelOpen && (
          <div
            ref={panelRef}
            role="region"
            aria-label="Focus timer"
            tabIndex={-1}
            style={{
              pointerEvents: "auto",
              width: 280,
              padding: 16,
              borderRadius: 12,
              border: "1px solid var(--default-border-color, #ced4da)",
              background: "var(--island-bg-color, #fff)",
              boxShadow: "var(--shadow-island, 0 4px 12px rgba(0,0,0,0.12))",
            }}
          >
            <div
              aria-live="polite"
              aria-atomic="true"
              style={{
                fontSize: 36,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                textAlign: "center",
                marginBottom: 12,
                color: isExpired
                  ? "var(--color-danger, #e03131)"
                  : "var(--text-primary-color, #1e1e1e)",
              }}
            >
              {isExpired ? "Time's up" : formatRemaining(displayRemainingMs)}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {PRESET_MINUTES.map((minutes) => {
                const selected =
                  timer.durationMs === minutes * 60_000 &&
                  !customMinutes.trim() &&
                  timer.status !== "running" &&
                  timer.status !== "paused";
                return (
                  <button
                    key={minutes}
                    type="button"
                    className="focus-timer-preset"
                    disabled={
                      timer.status === "running" || timer.status === "paused"
                    }
                    aria-pressed={selected}
                    onClick={() => selectPreset(minutes)}
                    style={{
                      flex: "1 1 40%",
                      minWidth: 56,
                      padding: "6px 8px",
                      borderRadius: 6,
                      border: selected
                        ? "2px solid var(--color-primary, #6965db)"
                        : "1px solid var(--default-border-color, #ced4da)",
                      background: selected
                        ? "var(--color-primary-light, #ececf4)"
                        : "transparent",
                      cursor:
                        timer.status === "running" ||
                        timer.status === "paused"
                          ? "not-allowed"
                          : "pointer",
                      fontSize: 13,
                    }}
                  >
                    {minutes}m
                  </button>
                );
              })}
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                fontSize: 13,
              }}
            >
              <span style={{ whiteSpace: "nowrap" }}>Custom (min)</span>
              <input
                type="number"
                min={1}
                step={1}
                value={customMinutes}
                disabled={
                  timer.status === "running" || timer.status === "paused"
                }
                onChange={(event) => setCustomMinutes(event.target.value)}
                onBlur={applyCustomDuration}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyCustomDuration();
                  }
                }}
                aria-label="Custom duration in minutes"
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--default-border-color, #ced4da)",
                  fontSize: 13,
                }}
              />
            </label>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(timer.status === "idle" || timer.status === "expired") && (
                <button
                  type="button"
                  className="focus-timer-control"
                  disabled={!canStart && timer.status !== "expired"}
                  onClick={() => {
                    if (timer.status === "expired") {
                      dispatch({ type: "reset" });
                    } else {
                      onStart();
                    }
                  }}
                  style={controlButtonStyle}
                >
                  {timer.status === "expired" ? "Reset" : "Start"}
                </button>
              )}
              {timer.status === "running" && (
                <button
                  type="button"
                  className="focus-timer-control"
                  onClick={() => dispatch({ type: "pause", now: Date.now() })}
                  style={controlButtonStyle}
                >
                  Pause
                </button>
              )}
              {timer.status === "paused" && (
                <button
                  type="button"
                  className="focus-timer-control"
                  onClick={() => dispatch({ type: "resume", now: Date.now() })}
                  style={controlButtonStyle}
                >
                  Resume
                </button>
              )}
              {(timer.status === "running" ||
                timer.status === "paused" ||
                timer.status === "expired") &&
                timer.status !== "expired" && (
                  <button
                    type="button"
                    className="focus-timer-control"
                    onClick={() => dispatch({ type: "reset" })}
                    style={controlButtonStyle}
                  >
                    Reset
                  </button>
                )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const controlButtonStyle: CSSProperties = {
  flex: 1,
  minWidth: 72,
  padding: "8px 12px",
  borderRadius: 6,
  border: "none",
  background: "var(--color-primary, #6965db)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};
