"use client";

import { useEffect, useState } from "react";

export function useNow(interval = 15_000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, interval);
    return () => clearInterval(timer);
  }, [interval]);

  return now;
}
