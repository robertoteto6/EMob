"use client";

import { useAppStore } from "../store";
import { useAutoHideOnScroll } from "../hooks/useAutoHideOnScroll";

export default function ScrollToTop() {
  const chatOpen = useAppStore(state => state.chatOpen);
  const isVisible = useAutoHideOnScroll({ threshold: 240, idleDelay: 200 });

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed right-4 sm:right-6 ${
        chatOpen
          ? "bottom-[calc(4.5rem+var(--safe-area-inset-bottom))] sm:bottom-[calc(6rem+var(--safe-area-inset-bottom))]"
          : "bottom-[calc(1rem+var(--safe-area-inset-bottom))] sm:bottom-[calc(1.5rem+var(--safe-area-inset-bottom))]"
      } z-30 rounded-full bg-green-600 p-3 text-white shadow-lg transition-all duration-300 ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      ↑
    </button>
  );
}
