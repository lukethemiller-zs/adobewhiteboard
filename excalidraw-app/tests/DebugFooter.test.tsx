/**
 * Guards DebugFooter control labels/testids so frame navigation buttons stay
 * correctly named for assistive tech and focused tests.
 */
import { fireEvent, render, screen } from "@excalidraw/excalidraw/tests/test-utils";

import { DebugFooter } from "../components/DebugCanvas";

describe("DebugFooter", () => {
  beforeEach(() => {
    window.visualDebug = {
      currentFrame: 2,
      data: [[], [], []],
    };
  });

  afterEach(() => {
    delete window.visualDebug;
  });

  it("exposes unique aria-labels and data-testids matching each control", () => {
    render(<DebugFooter onChange={() => {}} />);

    expect(screen.getByTestId("debug-trash")).toHaveAttribute(
      "aria-label",
      "Clear frames",
    );
    expect(screen.getByTestId("debug-backward")).toHaveAttribute(
      "aria-label",
      "Move backward",
    );
    expect(screen.getByTestId("debug-reset")).toHaveAttribute(
      "aria-label",
      "Reset frame",
    );
    expect(screen.getByTestId("debug-forward")).toHaveAttribute(
      "aria-label",
      "Move forward",
    );
  });

  it("wires each button to the matching visualDebug frame action", () => {
    const onChange = vi.fn();
    render(<DebugFooter onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("Move forward"));
    expect(window.visualDebug?.currentFrame).toBe(3);
    expect(onChange).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText("Move backward"));
    expect(window.visualDebug?.currentFrame).toBe(2);
    expect(onChange).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByLabelText("Reset frame"));
    expect(window.visualDebug?.currentFrame).toBeUndefined();
    expect(onChange).toHaveBeenCalledTimes(3);

    window.visualDebug!.currentFrame = 1;
    window.visualDebug!.data = [[], []];
    fireEvent.click(screen.getByLabelText("Clear frames"));
    expect(window.visualDebug?.currentFrame).toBeUndefined();
    expect(window.visualDebug?.data).toEqual([]);
    expect(onChange).toHaveBeenCalledTimes(4);
  });
});
