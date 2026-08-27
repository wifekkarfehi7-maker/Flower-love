"use client";

import * as React from "react";

export interface CountdownValue {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

const ZERO: CountdownValue = { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false };

function computeCountdown(target: Date): CountdownValue {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };

  const seconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    isPast: false,
  };
}

/** Live countdown to a target date, ticking every second. SSR-safe (renders zeros until mounted). */
export function useCountdown(targetDate: string | null, targetTime?: string | null): CountdownValue {
  const target = React.useMemo(() => {
    if (!targetDate) return null;
    const iso = targetTime ? `${targetDate}T${targetTime}` : `${targetDate}T00:00:00`;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [targetDate, targetTime]);

  const [value, setValue] = React.useState<CountdownValue>(ZERO);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (!target) return;

    setValue(computeCountdown(target));
    const interval = setInterval(() => setValue(computeCountdown(target)), 1000);
    return () => clearInterval(interval);
  }, [target]);

  return mounted ? value : ZERO;
}
