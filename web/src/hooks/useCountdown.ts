import { useState, useEffect, useCallback } from 'react';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number; // Total milliseconds remaining
  isExpired: boolean;
}

export function useCountdown(targetDate: Date | string | null): CountdownTime {
  const calculateTimeLeft = useCallback((): CountdownTime => {
    if (!targetDate) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isExpired: true };
    }

    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    const now = new Date();
    const difference = target.getTime() - now.getTime();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isExpired: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, total: difference, isExpired: false };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState<CountdownTime>(calculateTimeLeft);

  useEffect(() => {
    // Update immediately when target changes
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  return timeLeft;
}

// Format countdown for display
export function formatCountdown(countdown: CountdownTime): string {
  if (countdown.isExpired) {
    return 'Dropping now...';
  }

  if (countdown.days > 0) {
    return `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`;
  }

  if (countdown.hours > 0) {
    return `${countdown.hours}:${countdown.minutes.toString().padStart(2, '0')}:${countdown.seconds.toString().padStart(2, '0')}`;
  }

  return `${countdown.minutes}:${countdown.seconds.toString().padStart(2, '0')}`;
}

// Get relative time string for drop
export function getDropTimeString(scheduledFor: string): string {
  const target = new Date(scheduledFor);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Now';
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 7) {
    return target.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  if (diffDays >= 2) {
    return target.toLocaleDateString('en-GB', { weekday: 'short' }) + ` at ${target.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (diffDays >= 1) {
    return `Tomorrow at ${target.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (diffHours >= 1) {
    return `In ${diffHours}h ${diffMinutes % 60}m`;
  }

  return `In ${diffMinutes}m`;
}
