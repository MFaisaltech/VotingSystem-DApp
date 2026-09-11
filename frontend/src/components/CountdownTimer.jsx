import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getTimeRemaining } from '../utils/formatters';

export default function CountdownTimer({ targetTimestamp, labelPrefix = '', onExpire }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(targetTimestamp));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeRemaining(targetTimestamp);
      setTimeLeft(remaining);
      if (remaining.expired) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTimestamp, onExpire]);

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
        <Clock className="w-3.5 h-3.5" />
        <span>Election Ended</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
      <span className="text-xs text-slate-400">{labelPrefix}</span>
      <div className="flex items-center gap-1 font-mono text-xs font-semibold text-slate-200">
        {timeLeft.days > 0 && (
          <span className="bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
            {timeLeft.days}d
          </span>
        )}
        <span className="bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
          {String(timeLeft.hours).padStart(2, '0')}h
        </span>
        <span className="bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
          {String(timeLeft.minutes).padStart(2, '0')}m
        </span>
        <span className="bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50 text-indigo-400">
          {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      </div>
    </div>
  );
}
