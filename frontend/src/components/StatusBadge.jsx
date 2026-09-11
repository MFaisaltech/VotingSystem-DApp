import React from 'react';
import { Clock, Radio, CheckCircle2 } from 'lucide-react';

export default function StatusBadge({ status, className = '' }) {
  // 0: UPCOMING, 1: ACTIVE, 2: ENDED
  if (status === 0) {
    return (
      <span className={`badge-upcoming ${className}`}>
        <Clock className="w-3 h-3 animate-spin-slow" />
        Upcoming
      </span>
    );
  }

  if (status === 1) {
    return (
      <span className={`badge-active ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Live & Active
      </span>
    );
  }

  return (
    <span className={`badge-ended ${className}`}>
      <CheckCircle2 className="w-3 h-3" />
      Concluded
    </span>
  );
}
