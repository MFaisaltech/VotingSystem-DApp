import React from 'react';
import { AlertTriangle, Check, X, ShieldAlert } from 'lucide-react';

export default function VoteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  candidate,
  electionTitle,
}) {
  if (!isOpen || !candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 glass-card border border-indigo-500/30 rounded-2xl shadow-2xl bg-[#111622] text-slate-100">
        {/* Header Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <ShieldAlert className="w-6 h-6" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-center text-slate-100 mb-2">
          Confirm Your Vote
        </h3>

        {/* Election and Candidate Summary */}
        <div className="my-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Election</div>
          <div className="text-sm font-semibold text-slate-200 truncate">{electionTitle}</div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Selected Candidate:</span>
            <span className="text-sm font-bold text-indigo-400">{candidate.name} (Candidate #{candidate.id})</span>
          </div>
        </div>

        {/* Mandatory Warning Statement from requirements */}
        <div className="p-3 mb-6 rounded-lg bg-indigo-950/40 border border-indigo-800/40 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-200 leading-relaxed">
            You are voting for <strong>{candidate.name}</strong>. This action will be recorded on the blockchain and <strong>cannot be undone</strong>. Each wallet is restricted to exactly one vote.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-sm transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Confirm & Sign
          </button>
        </div>
      </div>
    </div>
  );
}
