import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trophy, 
  ShieldCheck, 
  Vote, 
  Users, 
  ArrowLeft, 
  RefreshCw, 
  ChevronDown, 
  AlertCircle,
  ExternalLink,
  Award,
  BarChart2
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { 
  getAllElections, 
  getElectionById, 
  getCandidates, 
  getWinnerInfo 
} from '../services/contractService';
import { calculatePercentage, shortenAddress } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';

export default function ResultsPage({ electionId, setActivePage, setSelectedElectionId }) {
  const { provider, getReadOnlyProvider, contractAddress } = useWeb3();

  const [allElections, setAllElections] = useState([]);
  const [currentElectionId, setCurrentElectionId] = useState(electionId || 1);
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [winnerInfo, setWinnerInfo] = useState({ winner: null, isTie: false, winningVoteCount: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (targetId) => {
    try {
      const p = provider || getReadOnlyProvider();
      const list = await getAllElections(p);
      setAllElections(list);

      const id = targetId || (list.length > 0 ? list[0].id : 1);
      setCurrentElectionId(id);

      const el = await getElectionById(id, p);
      const cands = await getCandidates(id, p);
      const win = await getWinnerInfo(id, p);

      setElection(el);
      // Sort candidates descending by voteCount for results view
      const sortedCands = [...cands].sort((a, b) => b.voteCount - a.voteCount);
      setCandidates(sortedCands);
      setWinnerInfo(win);
    } catch (err) {
      console.error("Results page load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [provider, getReadOnlyProvider]);

  useEffect(() => {
    loadData(electionId);
  }, [electionId, loadData]);

  const handleSelectElection = (e) => {
    const newId = Number(e.target.value);
    setCurrentElectionId(newId);
    if (setSelectedElectionId) setSelectedElectionId(newId);
    setLoading(true);
    loadData(newId);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(currentElectionId);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="mt-3 text-sm text-slate-400">Verifying on-chain tally results...</p>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-white">No Election Data Available</h2>
        <p className="text-sm text-slate-400 mt-2">Deploy and seed elections to inspect on-chain results.</p>
      </div>
    );
  }

  const isConcluded = election.status === 2;
  const hasVotes = election.totalVotes > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Bar: Selector & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Election Results Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time, cryptographically verified vote tallies computed directly by the smart contract.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Election Dropdown Selector */}
          <div className="relative">
            <select
              value={currentElectionId}
              onChange={handleSelectElection}
              className="appearance-none bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2 pr-10 text-xs font-semibold text-slate-200 hover:border-slate-600 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {allElections.map((el) => (
                <option key={el.id} value={el.id}>
                  #{el.id}: {el.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* On-Chain Verification Seal */}
      <div className="p-4 rounded-2xl glass-card border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>Results verified on-chain</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Smart Contract: {shortenAddress(contractAddress, 8)} • EVM Source of Truth
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={election.status} />
          <span className="text-xs font-mono font-semibold bg-slate-900 px-3 py-1 rounded-full border border-slate-800 text-indigo-300">
            {election.totalVotes} Total Ballots Cast
          </span>
        </div>
      </div>

      {/* Winner Spotlight Banner */}
      {hasVotes && winnerInfo.winner && (
        <div className={`p-6 sm:p-8 rounded-3xl glass-card border transition-all ${
          isConcluded
            ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-900/60 to-indigo-950/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
            : 'border-indigo-500/40 bg-gradient-to-r from-indigo-950/30 via-slate-900/60 to-violet-950/30'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                isConcluded
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                  : 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-400'
              }`}>
                {winnerInfo.isTie ? <Award className="w-8 h-8" /> : <Trophy className="w-8 h-8" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    {winnerInfo.isTie
                      ? 'Tie Between Leading Candidates'
                      : isConcluded
                      ? 'Official Certified Winner'
                      : 'Current Frontrunner (Live)'}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {winnerInfo.winner.name}
                </h2>

                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  {winnerInfo.winner.description}
                </p>
              </div>
            </div>

            <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
              <div className="text-right">
                <div className="text-3xl font-black text-white font-mono">
                  {winnerInfo.winningVoteCount} <span className="text-sm font-sans font-medium text-slate-400">votes</span>
                </div>
                <div className="text-xs font-semibold text-emerald-400 font-mono">
                  {calculatePercentage(winnerInfo.winningVoteCount, election.totalVotes)}% of total vote
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Visual Vote Distribution Chart & Breakdown */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800/90 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              <span>Ballot Distribution & Standing</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown of votes recorded in the DecentralizedVoting contract.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {candidates.length} Candidates
          </span>
        </div>

        {!hasVotes ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800">
            <Vote className="w-10 h-10 mx-auto text-slate-500 mb-2" />
            <h4 className="text-sm font-semibold text-slate-300">No Votes Cast Yet</h4>
            <p className="text-xs text-slate-500 mt-1">
              Be the first voter to participate in this election!
            </p>
            <button
              onClick={() => {
                setSelectedElectionId(election.id);
                setActivePage('electionDetail');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
            >
              Go to Ballot
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {candidates.map((cand, index) => {
              const percentage = calculatePercentage(cand.voteCount, election.totalVotes);
              const isWinner = winnerInfo.winner && winnerInfo.winner.id === cand.id && !winnerInfo.isTie;

              return (
                <div key={cand.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-mono text-xs font-bold text-indigo-300">
                        #{cand.id}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-white">{cand.name}</span>
                        {isWinner && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Trophy className="w-3 h-3" /> Leading
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-sm font-bold text-white">{cand.voteCount}</span>
                      <span className="text-xs text-slate-400 ml-1">votes</span>
                      <span className="font-mono text-xs font-semibold text-indigo-400 ml-3">({percentage}%)</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        index === 0
                          ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                          : index === 1
                          ? 'bg-gradient-to-r from-cyan-500 to-teal-500'
                          : 'bg-gradient-to-r from-slate-600 to-slate-500'
                      }`}
                      style={{ width: `${Math.max(Number(percentage), 2)}%` }}
                    ></div>
                  </div>

                  <p className="text-xs text-slate-400 pt-1">{cand.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
