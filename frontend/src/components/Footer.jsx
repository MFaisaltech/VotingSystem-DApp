import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, Copy, Check, Blocks } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { shortenAddress } from '../utils/formatters';

export default function Footer() {
  const { contractAddress } = useWeb3();
  const [copied, setCopied] = useState(false);

  const handleCopyContract = () => {
    if (contractAddress) {
      navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#0a0d14]/90 mt-20 py-8 px-4 sm:px-6 lg:px-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Branding & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400">
            <Blocks className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-200 text-sm">Decentralized Voting DApp</div>
            <div className="text-[11px] text-slate-500">Transparent, tamper-resistant governance on Ethereum</div>
          </div>
        </div>

        {/* Center: Contract Address Info */}
        {contractAddress && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-[11px]">
            <span className="text-slate-500">Smart Contract:</span>
            <span className="text-indigo-300 font-semibold">{shortenAddress(contractAddress, 6)}</span>
            <button
              onClick={handleCopyContract}
              className="p-1 text-slate-400 hover:text-white transition"
              title="Copy Contract Address"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Right: Security & Verification Badge */}
        <div className="flex items-center gap-2 text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Results verified on-chain • Zero centralized databases</span>
        </div>

      </div>
    </footer>
  );
}
