import React from 'react';

export default function SkeletonCard({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass-card p-6 rounded-2xl animate-pulse space-y-4 border border-slate-800/60"
        >
          <div className="flex items-center justify-between">
            <div className="h-5 bg-slate-800 rounded-md w-1/3"></div>
            <div className="h-6 bg-slate-800 rounded-full w-20"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-800/80 rounded w-full"></div>
            <div className="h-4 bg-slate-800/60 rounded w-4/5"></div>
          </div>
          <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center">
            <div className="h-4 bg-slate-800 rounded w-1/4"></div>
            <div className="h-8 bg-slate-800 rounded-xl w-24"></div>
          </div>
        </div>
      ))}
    </>
  );
}
