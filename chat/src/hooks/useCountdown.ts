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

// Format countdown for timer display (MM:SS or HH:MM:SS)
export function formatCountdown(countdown: CountdownTime): string {
  if (countdown.isExpired) {
    return '00:00';
  }

  if (countdown.hours > 0 || countdown.days > 0) {
    const totalHours = countdown.days * 24 + countdown.hours;
    return `${totalHours.toString().padStart(2, '0')}:${countdown.minutes.toString().padStart(2, '0')}:${countdown.seconds.toString().padStart(2, '0')}`;
  }

  return `${countdown.minutes.toString().padStart(2, '0')}:${countdown.seconds.toString().padStart(2, '0')}`;
}

// Format countdown for display in a human-readable way
export function formatCountdownHuman(countdown: CountdownTime): string {
  if (countdown.isExpired) {
    return 'now';
  }

  if (countdown.days > 0) {
    return `${countdown.days}d ${countdown.hours}h`;
  }

  if (countdown.hours > 0) {
    return `${countdown.hours}h ${countdown.minutes}m`;
  }

  if (countdown.minutes > 0) {
    return `${countdown.minutes}m ${countdown.seconds}s`;
  }

  return `${countdown.seconds}s`;
}
