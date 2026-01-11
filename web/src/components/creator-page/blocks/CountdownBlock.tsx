'use client';

import { useCountdown } from '@/hooks/useCountdown';
import type { CountdownBlockData } from '@/types/creator-page';

interface CountdownBlockProps {
  data: CountdownBlockData | Record<string, unknown>;
}

export function CountdownBlock({ data }: CountdownBlockProps) {
  const blockData = data as CountdownBlockData;
  const targetDate = blockData.targetDate;
  const countdown = useCountdown(targetDate || null);

  const showDays = blockData.showDays !== false;
  const showHours = blockData.showHours !== false;
  const showMinutes = blockData.showMinutes !== false;
  const showSeconds = blockData.showSeconds !== false;

  if (!targetDate) {
    return null;
  }

  // Show expired message
  if (countdown.isExpired) {
    return (
      <div className="text-center py-6">
        {blockData.heading && (
          <h3 className="text-lg font-semibold text-white mb-4">
            {blockData.heading}
          </h3>
        )}
        <div className="text-2xl font-bold text-emerald-400">
          {blockData.expiredMessage || 'Available Now!'}
        </div>
      </div>
    );
  }

  const timeUnits = [
    { value: countdown.days, label: 'Days', show: showDays },
    { value: countdown.hours, label: 'Hours', show: showHours },
    { value: countdown.minutes, label: 'Minutes', show: showMinutes },
    { value: countdown.seconds, label: 'Seconds', show: showSeconds },
  ].filter((unit) => unit.show);

  return (
    <div className="text-center py-4">
      {blockData.heading && (
        <h3 className="text-lg font-semibold text-white mb-6">
          {blockData.heading}
        </h3>
      )}

      <div className="flex justify-center gap-3 sm:gap-4">
        {timeUnits.map((unit, index) => (
          <div
            key={unit.label}
            className="bg-gray-800 border border-gray-700 rounded-xl p-3 sm:p-4 min-w-[70px] sm:min-w-[80px]"
          >
            <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
              {unit.value.toString().padStart(2, '0')}
            </div>
            <div className="text-xs sm:text-sm text-gray-400 mt-1">
              {unit.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
