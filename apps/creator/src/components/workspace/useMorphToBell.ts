"use client";

import { useEffect, useRef } from "react";

import { useGenerationStore } from "@rupakarsa/shared/stores/generation-store";

interface MorphTarget {
  id: string;
  label: string;
}

const MORPH_DURATION_MS = 450;

/**
 * Leaving a page with a live render morphs the Implement Mode panel into the notification bell, so
 * the user sees where the job went.
 *
 * The panel rect is measured while the page is still mounted: React runs passive effect cleanups
 * after it removed the tree, so querying the panel inside the cleanup would find nothing.
 */
export function useMorphToBell(active: MorphTarget | null): void {
  const pulseBell = useGenerationStore((state) => state.pulseBell);
  const latest = useRef(active);
  const panelRect = useRef<DOMRect | null>(null);

  useEffect(() => {
    latest.current = active;
    if (!active) {
      panelRect.current = null;
      return;
    }

    const panel = document.querySelector<HTMLElement>("[data-generation-panel]");
    if (!panel) {
      panelRect.current = null;
      return;
    }

    const measure = (): void => {
      panelRect.current = panel.getBoundingClientRect();
    };
    measure();

    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [active]);

  useEffect(() => {
    return () => {
      const target = latest.current;
      const from = panelRect.current;
      if (!target || !from) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) {
        pulseBell();
        return;
      }

      const bell = document.querySelector<HTMLElement>("[data-notification-bell]");
      if (!bell) return;

      const to = bell.getBoundingClientRect();
      if (from.width === 0 || to.width === 0) return;

      const overlay = document.createElement("div");
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.position = "fixed";
      overlay.style.left = `${from.left}px`;
      overlay.style.top = `${from.top}px`;
      overlay.style.width = `${from.width}px`;
      overlay.style.height = `${from.height}px`;
      overlay.style.pointerEvents = "none";
      overlay.style.zIndex = "60";
      overlay.style.borderRadius = "16px";
      overlay.style.background = "#101010";
      overlay.style.color = "#f5f1e8";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.fontSize = "11px";
      overlay.style.letterSpacing = "0.08em";
      overlay.style.textTransform = "uppercase";
      overlay.textContent = target.label;

      document.body.append(overlay);

      const translateX = to.left + to.width / 2 - (from.left + from.width / 2);
      const translateY = to.top + to.height / 2 - (from.top + from.height / 2);
      const scale = Math.max(to.width / from.width, 0.12);

      const animation = overlay.animate(
        [
          { transform: "translate(0, 0) scale(1)", opacity: 1 },
          {
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
            opacity: 0.2,
          },
        ],
        { duration: MORPH_DURATION_MS, easing: "cubic-bezier(0.22,1,0.36,1)", fill: "forwards" },
      );

      // A throttled or hidden tab may never advance the animation, so removal never depends on it.
      let settled = false;
      const settle = (pulse: boolean): void => {
        if (settled) return;
        settled = true;
        clearTimeout(fallback);
        overlay.remove();
        if (pulse) pulseBell();
      };
      const fallback = setTimeout(() => settle(true), MORPH_DURATION_MS + 200);
      animation.onfinish = () => settle(true);
      animation.oncancel = () => settle(false);
    };
  }, [pulseBell]);
}
