"use client";
import { useEffect, useState } from "react";

export default function Countdown({ targetTime }: { targetTime: number }) {
  const calc = () => Math.floor(targetTime - Date.now() / 1000);
  const [remaining, setRemaining] = useState(calc());

  useEffect(() => {
    const id = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(id);
  }, [targetTime]);

  if (remaining <= 0) {
    return <span>En vivo</span>;
  }
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  return (
    <span>
      Comienza en {days > 0 ? `${days}d ` : ""}
      {hours.toString().padStart(2, "0")}:
      {minutes.toString().padStart(2, "0")}:
      {seconds.toString().padStart(2, "0")}
    </span>
  );
}
