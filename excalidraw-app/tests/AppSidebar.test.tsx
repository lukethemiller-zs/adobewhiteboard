/**
 * Guards AppSidebar Comments/Presentation tab accessible names so icon-only
 * promo triggers stay distinguishable to assistive tech and focused tests.
 */
import React from "react";
import { vi } from "vitest";

import { render, screen } from "@excalidraw/excalidraw/tests/test-utils";

import {
  APP_SIDEBAR_TAB_LABELS,
  AppSidebar,
} from "../components/AppSidebar";

vi.mock("@excalidraw/excalidraw/context/ui-appState", () => ({
  useUIAppState: () => ({
    theme: "light",
    openSidebar: { name: "default", tab: "comments" },
  }),
}));

vi.mock("@excalidraw/excalidraw", () => {
  const TabTriggers = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-tab-triggers">{children}</div>
  );

  const DefaultSidebar = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="default-sidebar">{children}</div>
  );
  DefaultSidebar.TabTriggers = TabTriggers;

  return {
    THEME: { LIGHT: "light", DARK: "dark" },
    DefaultSidebar,
    Sidebar: {
      TabTrigger: ({
        children,
        tab,
        ...rest
      }: {
        children: React.ReactNode;
        tab: string;
      } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
        <button type="button" data-tab={tab} {...rest}>
          {children}
        </button>
      ),
      Tab: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      ),
    },
  };
});

vi.mock("@excalidraw/excalidraw/components/LinkButton", () => ({
  LinkButton: ({ children }: { children: React.ReactNode }) => (
    <a href="#">{children}</a>
  ),
}));

describe("AppSidebar", () => {
  it("exposes unique aria-labels and data-testids for promo tab triggers", () => {
    render(<AppSidebar />);

    expect(screen.getByTestId("sidebar-tab-comments")).toHaveAttribute(
      "aria-label",
      APP_SIDEBAR_TAB_LABELS.comments,
    );
    expect(screen.getByTestId("sidebar-tab-presentation")).toHaveAttribute(
      "aria-label",
      APP_SIDEBAR_TAB_LABELS.presentation,
    );

    expect(
      screen.getByLabelText(APP_SIDEBAR_TAB_LABELS.comments),
    ).toBeTruthy();
    expect(
      screen.getByLabelText(APP_SIDEBAR_TAB_LABELS.presentation),
    ).toBeTruthy();
  });
});
