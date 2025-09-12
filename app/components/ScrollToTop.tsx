"use client";

import { useEffect, useState } from "react";
import { useUIState } from "../store";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const { chatOpen } = useUIState();

  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed ${chatOpen ? "bottom-24" : "bottom-6"} right-6 z-30 rounded-full bg-green-600 p-3 text-white shadow-lg transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      ↑
    </button>
  );
}
