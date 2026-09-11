import React, { useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, ExternalLink, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { shortenAddress } from '../utils/formatters';

export default function TransactionModal({
  state, // 'IDLE' | 'CONFIRMING' | 'PENDING' | 'SUCCESS' | 'ERROR'
  txHash,
  errorMessage,
  onClose,
  title = 'Transaction in Progress',
}) {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (state === 'SUCCESS') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#10b981', '#818cf8', '#a78bfa']
        });
      } catch (e) {
        // Confetti optional
      }
    }
  }, [state]);

  if (state === 'IDLE' || !state) return null;

  const handleCopy = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 glass-card border border-slate-700/80 rounded-2xl shadow-2xl bg-[#111622] text-slate-100">
        
        {/* Close button (only visible on SUCCESS or ERROR) */}
        {(state === 'SUCCESS' || state === 'ERROR') && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        )}

        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          {/* Status Icon */}
          {state === 'CONFIRMING' && (
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {state === 'PENDING' && (
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {state === 'SUCCESS' && (
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>
          )}

          {state === 'ERROR' && (
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <XCircle className="w-9 h-9" />
            </div>
          )}

          {/* Title & Description */}
          <div>
            <h3 className="text-xl font-bold text-slate-100">
              {state === 'CONFIRMING' && 'Signature Required'}
              {state === 'PENDING' && 'Broadcasting Transaction'}
              {state === 'SUCCESS' && 'Transaction Confirmed!'}
              {state === 'ERROR' && 'Transaction Failed'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {state === 'CONFIRMING' && 'Please confirm and sign the transaction in your connected Web3 wallet.'}
              {state === 'PENDING' && 'Transaction broadcasted to blockchain node. Waiting for block confirmation...'}
              {state === 'SUCCESS' && 'Your vote has been permanently written to the Solidity smart contract.'}
              {state === 'ERROR' && (errorMessage || 'The blockchain transaction could not be executed.')}
            </p>
          </div>

          {/* Transaction Hash Badge */}
          {txHash && (
            <div className="w-full p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
              <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                <span>Transaction Hash</span>
                <span className="text-[10px] text-emerald-400 font-medium">Verified On-Chain</span>
              </div>
              <div className="flex items-center justify-between font-mono text-xs text-slate-200">
                <span>{shortenAddress(txHash, 10)}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                  title="Copy Hash"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Action button */}
          {(state === 'SUCCESS' || state === 'ERROR') && (
            <button
              onClick={onClose}
              className={`w-full mt-2 py-2.5 rounded-xl font-semibold text-sm transition shadow-lg ${
                state === 'SUCCESS'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {state === 'SUCCESS' ? 'Done & Refresh' : 'Dismiss'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
