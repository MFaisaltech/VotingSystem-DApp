import React from 'react';
import { 
  ShieldCheck, 
  Vote, 
  Lock, 
  Eye, 
  ArrowRight, 
  FileCheck2, 
  Cpu, 
  Sparkles,
  Wallet
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';

export default function LandingPage({ setActivePage }) {
  const { isConnected, connectWallet } = useWeb3();

  const features = [
    {
      icon: Lock,
      title: "Blockchain-Secured Voting",
      description: "Every ballot is cryptographically signed and permanently recorded on the Ethereum blockchain, eliminating unauthorized tampering or retroactive alteration.",
      color: "from-indigo-500/20 to-blue-500/10",
      border: "border-indigo-500/30",
      iconColor: "text-indigo-400",
    },
    {
      icon: Eye,
      title: "Transparent Results",
      description: "All candidate vote tallies and winner determinations are computed directly by the Solidity smart contract. Anyone can independently verify the count in real time.",
      color: "from-cyan-500/20 to-teal-500/10",
      border: "border-cyan-500/30",
      iconColor: "text-cyan-400",
    },
    {
      icon: Vote,
      title: "One Wallet, One Vote",
      description: "Smart contract mapping guarantees strictly one vote per connected wallet address. Double voting is mathematically rejected at the protocol layer.",
      color: "from-violet-500/20 to-purple-500/10",
      border: "border-violet-500/30",
      iconColor: "text-violet-400",
    },
    {
      icon: FileCheck2,
      title: "Tamper-Resistant Records",
      description: "Election creation, candidate rosters, and voting windows are locked into contract state. Once voting commences, administrative manipulation is strictly blocked.",
      color: "from-emerald-500/20 to-teal-500/10",
      border: "border-emerald-500/30",
      iconColor: "text-emerald-400",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Connect Wallet",
      desc: "Connect your MetaMask or Web3 browser wallet. Your address acts as your verifiable cryptographic voter ID.",
    },
    {
      num: "02",
      title: "Browse Elections",
      desc: "Explore active student council, university guild, and governance elections with full candidate platforms.",
    },
    {
      num: "03",
      title: "Cast On-Chain Vote",
      desc: "Select your preferred candidate and sign the transaction. Gas-optimized contract records your ballot.",
    },
    {
      num: "04",
      title: "Verify Live Results",
      desc: "Watch live tally bars update directly from the blockchain state as votes are confirmed across the network.",
    },
  ];

  return (
    <div className="space-y-24 py-6">
      
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto px-4 pt-12 sm:pt-20">
        
        {/* Glow Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-900/40 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6 shadow-glow">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Next-Generation On-Chain Governance</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Decentralized Voting. <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300">
            Transparent Decisions.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          A production-grade Web3 voting platform powered by Solidity smart contracts. Enforcing cryptographic integrity, one-wallet-one-vote rules, and instant public verifiability.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setActivePage('elections')}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 group"
          >
            <span>View Active Elections</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {!isConnected ? (
            <button
              onClick={connectWallet}
              className="px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-all flex items-center gap-2"
            >
              <Wallet className="w-4 h-4 text-indigo-400" />
              <span>Connect Wallet</span>
            </button>
          ) : (
            <button
              onClick={() => setActivePage('dashboard')}
              className="px-6 py-3.5 rounded-xl border border-indigo-500/40 bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-300 font-semibold text-sm transition-all"
            >
              Go to Dashboard
            </button>
          )}
        </div>

        {/* Metrics Pill */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl glass-card border border-slate-800/80 text-left">
          <div>
            <div className="text-2xl font-bold text-white font-mono">100%</div>
            <div className="text-xs text-slate-400 mt-0.5">On-Chain Truth</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-400 font-mono">1-Wallet</div>
            <div className="text-xs text-slate-400 mt-0.5">1-Vote Protocol</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">0 Gas</div>
            <div className="text-xs text-slate-400 mt-0.5">For Result Queries</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400 font-mono">0</div>
            <div className="text-xs text-slate-400 mt-0.5">Central Databases</div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Why Decentralized Governance?</h2>
          <p className="text-sm text-slate-400 mt-2">
            Traditional centralized voting relies on trust in system administrators. Our smart contracts guarantee trust through mathematics and open code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className={`p-6 rounded-2xl glass-card border ${feat.border} bg-gradient-to-br ${feat.color} hover:scale-[1.01] transition duration-200`}
              >
                <div className={`w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-center mb-4 ${feat.iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Step-by-Step Flow */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="p-8 sm:p-12 rounded-3xl glass-card border border-slate-800 bg-[#0d121e]/80">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">How It Works</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">Simple, Secure & Verifiable</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, idx) => (
              <div key={idx} className="relative p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="font-mono text-2xl font-black text-indigo-500/40">{s.num}</span>
                <h4 className="text-base font-bold text-slate-100 mt-2">{s.title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => setActivePage('elections')}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30"
            >
              Explore Elections Now
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
