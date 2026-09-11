import React, { useState, useEffect } from 'react';
import { 
  Vote, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ArrowRight, 
  Wallet, 
  ShieldCheck, 
  RefreshCw, 
  Sparkles,
  Award
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { getAllElections, getUserVoteInfo } from '../services/contractService';
import { shortenAddress } from '../utils/formatters';
import SkeletonCard from '../components/SkeletonCard';
import StatusBadge from '../components/StatusBadge';

export default function DashboardPage({ setActivePage, setSelectedElectionId }) {
  const { account, isConnected, isOwner, provider, getReadOnlyProvider, connectWallet } = useWeb3();

  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userVotedMap, setUserVotedMap] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const p = provider || getReadOnlyProvider();
      const list = await getAllElections(p);
      setElections(list);

      // Check user voting history if wallet connected
      if (account) {
        const votes = {};
        for (const el of list) {
          const { hasVoted, candidateId } = await getUserVoteInfo(el.id, account, p);
          if (hasVoted) {
            votes[el.id] = candidateId;
          }
        }
        setUserVotedMap(votes);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [account, provider]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const activeCount = elections.filter((e) => e.status === 1).length;
  const completedCount = elections.filter((e) => e.status === 2).length;
  const upcomingCount = elections.filter((e) => e.status === 0).length;
  const totalVotesOnChain = elections.reduce((sum, e) => sum + e.totalVotes, 0);
  const userVotedCount = Object.keys(userVotedMap).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner with Quick Greeting & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Governance Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time on-chain voting metrics and wallet participation overview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Blockchain Data
          </button>
        </div>
      </div>

      {/* Wallet Status Banner */}
      {!isConnected ? (
        <div className="p-6 rounded-2xl glass-card border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Connect Your Web3 Wallet</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Connect MetaMask or a compatible browser wallet to check eligibility and cast votes on-chain.
              </p>
            </div>
          </div>
          <button
            onClick={connectWallet}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition shrink-0"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="p-5 rounded-2xl glass-card border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Connected Wallet:</span>
                <span className="font-mono text-xs font-semibold text-white">{account}</span>
                {isOwner && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Contract Admin
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                You have participated in <strong className="text-indigo-400">{userVotedCount}</strong> of <strong className="text-white">{elections.length}</strong> on-chain elections.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto">
            {isOwner && (
              <button
                onClick={() => setActivePage('admin')}
                className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-semibold text-xs transition"
              >
                Admin Console
              </button>
            )}
            <button
              onClick={() => setActivePage('elections')}
              className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/20"
            >
              Vote Now
            </button>
          </div>
        </div>
      )}

      {/* High-Level Blockchain Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl glass-card border border-emerald-500/20 bg-emerald-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400">Active Elections</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Clock className="w-4 h-4 animate-spin-slow" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-3">{activeCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Open for voter participation</div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Concluded Elections</span>
            <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-3">{completedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Verified on-chain results</div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-indigo-500/20 bg-indigo-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-400">Total Votes Cast</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Vote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-3">{totalVotesOnChain}</div>
          <div className="text-[11px] text-slate-400 mt-1">Recorded on smart contract</div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-violet-500/20 bg-violet-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-violet-400">Your Cast Votes</span>
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-3">
            {isConnected ? userVotedCount : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isConnected ? 'Ballots signed by your wallet' : 'Connect wallet to view'}
          </div>
        </div>
      </div>

      {/* Active Elections Spotlight */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Live Elections Spotlight</h2>
            <p className="text-xs text-slate-400">Vote before the on-chain timer expires.</p>
          </div>
          <button
            onClick={() => setActivePage('elections')}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
          >
            <span>View All ({elections.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <SkeletonCard count={3} />
          </div>
        ) : elections.length === 0 ? (
          <div className="p-12 text-center glass-card rounded-2xl border border-slate-800">
            <Layers className="w-10 h-10 mx-auto text-slate-500 mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No Elections Created Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Deploy the seed script or use the Admin portal to create the first election.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {elections.slice(0, 3).map((el) => {
              const hasVoted = Boolean(userVotedMap[el.id]);
              return (
                <div
                  key={el.id}
                  className="glass-card-hover p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs text-slate-400">Election #{el.id}</span>
                      <StatusBadge status={el.status} />
                    </div>

                    <h3 className="text-base font-bold text-white mb-2 line-clamp-1">{el.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {el.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Candidates: <strong className="text-slate-200">{el.candidateCount}</strong></span>
                      <span>Total Votes: <strong className="text-indigo-400">{el.totalVotes}</strong></span>
                    </div>

                    {hasVoted && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Voted (Candidate #{userVotedMap[el.id]})</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedElectionId(el.id);
                          setActivePage('electionDetail');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition text-center shadow-sm"
                      >
                        {el.status === 1 ? (hasVoted ? 'View Ballot' : 'Cast Vote') : 'View Details'}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedElectionId(el.id);
                          setActivePage('results');
                        }}
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
                        title="View Live Results"
                      >
                        Results
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
