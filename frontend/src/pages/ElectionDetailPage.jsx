import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Users, 
  Vote, 
  CheckCircle2, 
  ShieldAlert, 
  BarChart3, 
  User, 
  RefreshCw,
  Wallet
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { 
  getElectionById, 
  getCandidates, 
  getUserVoteInfo, 
  castVoteTx 
} from '../services/contractService';
import { formatDateTime, calculatePercentage } from '../utils/formatters';
import { parseContractError } from '../utils/errorParser';
import StatusBadge from '../components/StatusBadge';
import CountdownTimer from '../components/CountdownTimer';
import VoteConfirmationModal from '../components/VoteConfirmationModal';
import TransactionModal from '../components/TransactionModal';

export default function ElectionDetailPage({ 
  electionId, 
  setActivePage, 
  setSelectedElectionId 
}) {
  const { account, signer, isConnected, provider, getReadOnlyProvider, connectWallet } = useWeb3();

  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [userVote, setUserVote] = useState({ hasVoted: false, candidateId: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Voting flow state
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [txState, setTxState] = useState('IDLE'); // 'CONFIRMING' | 'PENDING' | 'SUCCESS' | 'ERROR'
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);

  const loadData = useCallback(async () => {
    if (!electionId) return;
    try {
      const p = provider || getReadOnlyProvider();
      const el = await getElectionById(electionId, p);
      const cands = await getCandidates(electionId, p);
      setElection(el);
      setCandidates(cands);

      if (account) {
        const status = await getUserVoteInfo(electionId, account, p);
        setUserVote(status);
      }
    } catch (err) {
      console.error("Error loading election details:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [electionId, account, provider, getReadOnlyProvider]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInitiateVote = (candidate) => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    setSelectedCandidate(candidate);
    setIsConfirmOpen(true);
  };

  const handleConfirmVote = async () => {
    setIsConfirmOpen(false);
    if (!selectedCandidate || !signer) return;

    setTxState('CONFIRMING');
    setTxError(null);
    setTxHash(null);

    try {
      // Step 2: Wallet transaction opens
      const { tx, receipt } = await castVoteTx(electionId, selectedCandidate.id, signer);
      setTxHash(receipt.hash || tx.hash);

      // Step 3 & 4: Pending / mining
      setTxState('PENDING');

      // Step 5: Success state
      setTxState('SUCCESS');

      // Step 6: Refresh blockchain data
      await loadData();
    } catch (err) {
      console.error("Voting error:", err);
      const friendlyMessage = parseContractError(err);
      setTxError(friendlyMessage);
      setTxState('ERROR');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="mt-3 text-sm text-slate-400">Loading verified blockchain data...</p>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-white">Election Not Found</h2>
        <p className="text-sm text-slate-400 mt-2">The requested election could not be located on-chain.</p>
        <button
          onClick={() => setActivePage('elections')}
          className="mt-6 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          Back to Elections
        </button>
      </div>
    );
  }

  const isElectionActive = election.status === 1;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back button & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActivePage('elections')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Elections</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRefreshing(true);
              loadData();
            }}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => {
              setSelectedElectionId(election.id);
              setActivePage('results');
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 border border-indigo-500/30 transition"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Live Results</span>
          </button>
        </div>
      </div>

      {/* Main Election Header Card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800/90 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
              Election #{election.id}
            </span>
            <StatusBadge status={election.status} />
          </div>

          {/* Timing details */}
          {election.status === 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Voting closes in:</span>
              <CountdownTimer targetTimestamp={election.endTime} onExpire={loadData} />
            </div>
          )}
          {election.status === 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Voting opens in:</span>
              <CountdownTimer targetTimestamp={election.startTime} onExpire={loadData} />
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
            {election.title}
          </h1>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-3xl">
            {election.description}
          </p>
        </div>

        {/* Schedule & Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <div className="text-slate-500">Start Time</div>
              <div className="font-mono text-slate-200">{formatDateTime(election.startTime)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <div className="text-slate-500">End Time</div>
              <div className="font-mono text-slate-200">{formatDateTime(election.endTime)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Vote className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <div className="text-slate-500">Total Participation</div>
              <div className="font-mono text-slate-200">{election.totalVotes} Verified Votes</div>
            </div>
          </div>
        </div>

        {/* User Voting Status Banner */}
        {userVote.hasVoted && (
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-emerald-300">Your Ballot Has Been Recorded</div>
                <div className="text-xs text-emerald-200/70">
                  Wallet address has voted for Candidate #{userVote.candidateId}. 1-wallet-1-vote is enforced.
                </div>
              </div>
            </div>
            <span className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
              Voted
            </span>
          </div>
        )}
      </div>

      {/* Candidates Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Candidates Roster</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review candidates and cast your ballot. One vote allowed per connected wallet.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-400">
            {candidates.length} Registered Candidates
          </span>
        </div>

        {candidates.length === 0 ? (
          <div className="p-12 text-center glass-card rounded-2xl border border-slate-800">
            <Users className="w-10 h-10 mx-auto text-slate-500 mb-2" />
            <p className="text-sm text-slate-400">No candidates registered for this election yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {candidates.map((cand) => {
              const isUserChoice = userVote.hasVoted && userVote.candidateId === cand.id;
              const voteShare = calculatePercentage(cand.voteCount, election.totalVotes);

              return (
                <div
                  key={cand.id}
                  className={`glass-card p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                    isUserChoice
                      ? 'border-emerald-500/50 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-indigo-400 font-mono font-bold">
                        #{cand.id}
                      </div>
                      {isUserChoice ? (
                        <span className="badge-active">
                          <CheckCircle2 className="w-3 h-3" />
                          Your Choice
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-slate-400">
                          {cand.voteCount} votes ({voteShare}%)
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">{cand.name}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-6">
                      {cand.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 space-y-3">
                    {/* Vote progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Current Tally</span>
                        <span className="font-mono font-semibold text-slate-200">{cand.voteCount} votes</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${voteShare}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Button */}
                    {userVote.hasVoted ? (
                      <button
                        disabled
                        className={`w-full py-2.5 rounded-xl font-semibold text-xs transition cursor-not-allowed ${
                          isUserChoice
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-900 text-slate-500 border border-slate-800'
                        }`}
                      >
                        {isUserChoice ? '✓ You Voted For This Candidate' : 'Already Voted'}
                      </button>
                    ) : !isElectionActive ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl bg-slate-900 text-slate-500 border border-slate-800 font-semibold text-xs cursor-not-allowed"
                      >
                        {election.status === 0 ? 'Voting Not Started' : 'Election Concluded'}
                      </button>
                    ) : !isConnected ? (
                      <button
                        onClick={connectWallet}
                        className="w-full py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Connect to Vote</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleInitiateVote(cand)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5"
                      >
                        <Vote className="w-3.5 h-3.5" />
                        <span>Vote for {cand.name}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vote Confirmation Modal */}
      <VoteConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmVote}
        candidate={selectedCandidate}
        electionTitle={election.title}
      />

      {/* Transaction Lifecycle Modal */}
      <TransactionModal
        state={txState}
        txHash={txHash}
        errorMessage={txError}
        onClose={() => setTxState('IDLE')}
      />

    </div>
  );
}
