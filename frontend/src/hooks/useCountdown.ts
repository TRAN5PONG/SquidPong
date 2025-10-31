// src/hooks/useCountdown.ts

import { useEffect, useState } from "@/lib/Zeroact";

export function useCountdown(targetDate?: string | number | Date | null) {
  // If no target date, we return "idle" state
  const target = targetDate ? new Date(targetDate).getTime() : null;
  const [timeLeft, setTimeLeft] = useState(
    target ? target - Date.now() : 0
  );

  useEffect(() => {
    if (!target) return; 

    const interval = setInterval(() => {
      setTimeLeft(target - Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [target]);

  if (!target) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: false,
      idle: true, 
    };
  }

  const total = Math.max(timeLeft, 0);
  const expired = total <= 0;

  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const seconds = Math.floor((total / 1000) % 60);

  return { days, hours, minutes, seconds, expired, idle: false };
}
