"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type EstimateTableStickyShellProps = {
  header: ReactNode;
  children: ReactNode;
};

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
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
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
