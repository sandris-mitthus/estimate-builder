"use client";

import { SIDEBAR_LAYOUT_CHANGE_EVENT } from "@/app/lib/navigation/sidebar-cookie";
import { syncStickyGroupRows } from "@/app/lib/estimates/sticky-group-rows";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type EstimateTableStickyShellProps = {
  header: ReactNode;
  children: ReactNode;
};

const SIDEBAR_LAYOUT_TRANSITION_MS = 220;

function runLayoutSyncUpdates(update: () => void): () => void {
  let frameId = 0;
  const startedAt = performance.now();

  const tick = () => {
    update();
    if (performance.now() - startedAt < SIDEBAR_LAYOUT_TRANSITION_MS) {
      frameId = requestAnimationFrame(tick);
    }
  };

  update();
  frameId = requestAnimationFrame(tick);

  return () => cancelAnimationFrame(frameId);
}

export function EstimateTableStickyShell({
  header,
  children,
}: EstimateTableStickyShellProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [pinStyle, setPinStyle] = useState<CSSProperties | null>(null);

  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) {
      return;
    }

    const updateHeaderHeight = () => {
      setHeaderHeight(headerEl.offsetHeight);
    };

    updateHeaderHeight();
    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    resizeObserver.observe(headerEl);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const scope = scopeRef.current;
    const headerEl = headerRef.current;
    if (!scope || !headerEl) {
      return;
    }

    const update = () => {
      const scopeRect = scope.getBoundingClientRect();
      const nextHeaderHeight = headerEl.offsetHeight;
      const shouldPin =
        scopeRect.top < 0 && scopeRect.bottom > nextHeaderHeight;

      setIsPinned(shouldPin);
      setHeaderHeight(nextHeaderHeight);

      if (shouldPin) {
        setPinStyle({
          left: scopeRect.left,
          width: scopeRect.width,
        });
      } else {
        setPinStyle(null);
      }

      syncStickyGroupRows(scope, nextHeaderHeight);
    };

    let stopLayoutSync = runLayoutSyncUpdates(update);

    const scheduleLayoutSync = () => {
      stopLayoutSync();
      stopLayoutSync = runLayoutSyncUpdates(update);
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", scheduleLayoutSync);
    window.addEventListener(SIDEBAR_LAYOUT_CHANGE_EVENT, scheduleLayoutSync);

    const observedElements = new Set<Element>();
    const layoutObserver = new ResizeObserver(scheduleLayoutSync);
    let ancestor: HTMLElement | null = scope;
    while (ancestor) {
      if (!observedElements.has(ancestor)) {
        observedElements.add(ancestor);
        layoutObserver.observe(ancestor);
      }
      ancestor = ancestor.parentElement;
    }

    const mainLayout = document.querySelector("[data-app-main]");
    const onMainLayoutTransition = (event: Event) => {
      if (
        event instanceof TransitionEvent &&
        (event.propertyName === "padding-left" || event.propertyName === "padding")
      ) {
        scheduleLayoutSync();
      }
    };
    mainLayout?.addEventListener("transitionrun", scheduleLayoutSync);
    mainLayout?.addEventListener("transitionend", onMainLayoutTransition);

    const sidebar = document.querySelector("aside[data-expanded]");
    let sidebarObserver: MutationObserver | null = null;
    if (sidebar instanceof HTMLElement) {
      sidebarObserver = new MutationObserver(scheduleLayoutSync);
      sidebarObserver.observe(sidebar, {
        attributes: true,
        attributeFilter: ["data-expanded"],
      });
    }

    return () => {
      stopLayoutSync();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", scheduleLayoutSync);
      window.removeEventListener(SIDEBAR_LAYOUT_CHANGE_EVENT, scheduleLayoutSync);
      layoutObserver.disconnect();
      mainLayout?.removeEventListener("transitionrun", scheduleLayoutSync);
      mainLayout?.removeEventListener("transitionend", onMainLayoutTransition);
      sidebarObserver?.disconnect();
    };
  }, []);

  return (
    <div ref={scopeRef} className="estimate-table-scroll-scope">
      <div
        ref={headerRef}
        className={`z-20 border-b border-zinc-200 bg-white ${
          isPinned
            ? "fixed top-0 shadow-sm"
            : "overflow-hidden rounded-t-2xl"
        }`}
        style={isPinned ? pinStyle ?? undefined : undefined}
      >
        {header}
      </div>
      {isPinned && headerHeight > 0 ? (
        <div aria-hidden="true" style={{ height: headerHeight }} />
      ) : null}
      {children}
    </div>
  );
}
