import React, { useState } from 'react';
import { 
  Vote, 
  Wallet, 
  ShieldCheck, 
  LogOut, 
  Copy, 
  Check, 
  AlertTriangle,
  ChevronDown,
  LayoutDashboard,
  Layers,
  BarChart3
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { shortenAddress } from '../utils/formatters';

export default function Navbar({ activePage, setActivePage }) {
  const { 
    account, 
    isConnected, 
    isConnecting, 
    isOwner, 
    chainId, 
    expectedChainId, 
    isWrongNetwork, 
    connectWallet, 
    disconnectWallet, 
    switchNetwork 
  } = useWeb3();

  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleCopy = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navItems = [
    { id: 'landing', label: 'Home' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'elections', label: 'Elections', icon: Layers },
    { id: 'results', label: 'Results', icon: BarChart3 },
  ];

  if (isOwner) {
    navItems.push({ id: 'admin', label: 'Admin Portal', icon: ShieldCheck, highlight: true });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0a0d14]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActivePage('landing')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition duration-200">
            <Vote className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300">
              Decentralized Voting
            </span>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              On-Chain Governance
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition duration-200 ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : item.highlight
                    ? 'text-amber-400 hover:bg-amber-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Web3 Wallet & Network Action */}
        <div className="flex items-center gap-3">
          
          {/* Wrong Network Banner Button */}
          {isConnected && isWrongNetwork && (
            <button
              onClick={() => switchNetwork(expectedChainId)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Switch to Hardhat (31337)
            </button>
          )}

          {/* Network Indicator */}
          {isConnected && !isWrongNetwork && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Hardhat Local
            </div>
          )}

          {/* Wallet State Button */}
          {!isConnected ? (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
            >
              <Wallet className="w-4 h-4" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 text-sm font-mono transition"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                <span>{shortenAddress(account)}</span>
                {isOwner && (
                  <span className="text-[10px] uppercase font-sans font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Admin
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl glass-card border border-slate-700 p-2 shadow-2xl z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <div className="text-xs text-slate-400">Connected Wallet</div>
                    <div className="font-mono text-xs text-indigo-300 break-all">{account}</div>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Address Copied!' : 'Copy Address'}
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => {
                        setActivePage('admin');
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-amber-300 hover:bg-amber-500/10 transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Admin Dashboard
                    </button>
                  )}

                  <button
                    onClick={() => {
                      disconnectWallet();
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Mobile navigation row */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 px-2 py-2 bg-[#0d121c]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-2 rounded-lg ${
                isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
