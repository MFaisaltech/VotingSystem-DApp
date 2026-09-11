import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  PlusCircle, 
  UserPlus, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  RefreshCw,
  PowerOff,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { 
  getAllElections, 
  createElectionTx, 
  addCandidateTx, 
  endElectionTx 
} from '../services/contractService';
import { parseContractError } from '../utils/errorParser';
import { formatDateTime, shortenAddress } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';
import TransactionModal from '../components/TransactionModal';

export default function AdminPage({ setActivePage, setSelectedElectionId }) {
  const { account, signer, isOwner, isConnected, provider, getReadOnlyProvider, connectWallet } = useWeb3();

  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form states: Create Election
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form states: Add Candidate
  const [selectedElectionId, setSelectedElectionIdForm] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateDesc, setCandidateDesc] = useState('');

  // Tx state
  const [txState, setTxState] = useState('IDLE');
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const p = provider || getReadOnlyProvider();
      const list = await getAllElections(p);
      setElections(list);
      if (list.length > 0 && !selectedElectionId) {
        setSelectedElectionIdForm(String(list[0].id));
      }
    } catch (err) {
      console.error("Error loading admin elections:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [provider, getReadOnlyProvider, selectedElectionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set default start/end dates for convenience (e.g. now + 5 mins, ends in 7 days)
  useEffect(() => {
    const now = new Date(Date.now() + 5 * 60 * 1000);
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // format for datetime-local: YYYY-MM-DDTHH:mm
    const toISO = (d) => d.toISOString().slice(0, 16);
    setStartDate(toISO(now));
    setEndDate(toISO(end));
  }, []);

  const handleCreateElection = async (e) => {
    e.preventDefault();
    if (!signer) return;

    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

    if (endTimestamp <= startTimestamp) {
      alert("End time must be after start time.");
      return;
    }

    setTxState('CONFIRMING');
    setTxError(null);
    setTxHash(null);

    try {
      const { tx, receipt } = await createElectionTx(
        title.trim(),
        description.trim(),
        startTimestamp,
        endTimestamp,
        signer
      );
      setTxHash(receipt.hash || tx.hash);
      setTxState('SUCCESS');
      setTitle('');
      setDescription('');
      await loadData();
    } catch (err) {
      console.error("Create election error:", err);
      setTxError(parseContractError(err));
      setTxState('ERROR');
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!signer || !selectedElectionId) return;

    setTxState('CONFIRMING');
    setTxError(null);
    setTxHash(null);

    try {
      const { tx, receipt } = await addCandidateTx(
        Number(selectedElectionId),
        candidateName.trim(),
        candidateDesc.trim(),
        signer
      );
      setTxHash(receipt.hash || tx.hash);
      setTxState('SUCCESS');
      setCandidateName('');
      setCandidateDesc('');
      await loadData();
    } catch (err) {
      console.error("Add candidate error:", err);
      setTxError(parseContractError(err));
      setTxState('ERROR');
    }
  };

  const handleEndElection = async (electionId) => {
    if (!confirm(`Are you sure you want to conclude Election #${electionId} immediately?`)) {
      return;
    }
    if (!signer) return;

    setTxState('CONFIRMING');
    setTxError(null);
    setTxHash(null);

    try {
      const { tx, receipt } = await endElectionTx(electionId, signer);
      setTxHash(receipt.hash || tx.hash);
      setTxState('SUCCESS');
      await loadData();
    } catch (err) {
      console.error("End election error:", err);
      setTxError(parseContractError(err));
      setTxState('ERROR');
    }
  };

  // If wallet is not connected or connected wallet is not contract owner:
  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-indigo-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Administrator Access Required</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Please connect the contract deployer / owner wallet to manage elections and candidates.
        </p>
        <button
          onClick={connectWallet}
          className="mt-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
        >
          Connect Admin Wallet
        </button>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Unauthorized Address</h2>
        <p className="text-sm text-slate-300 max-w-md mx-auto">
          Connected wallet <span className="font-mono text-xs text-rose-400 font-semibold">{shortenAddress(account, 6)}</span> is not the registered owner of the DecentralizedVoting contract.
        </p>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 text-left max-w-md mx-auto space-y-1 font-mono">
          <div>Your Wallet: {account}</div>
          <div className="text-amber-400 pt-1">Note: Switch to Account #0 in MetaMask (deployer) to access administrative privileges.</div>
        </div>
        <button
          onClick={() => setActivePage('elections')}
          className="mt-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
        >
          Return to Voter Portal
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
              Superadmin Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Contract Administration
          </h1>
          <p className="text-xs text-slate-400">
            Create elections, register candidate rosters, and manage election state directly on-chain.
          </p>
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            loadData();
          }}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Sync
        </button>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Form 1: Create New Election */}
        <div className="glass-card p-6 rounded-3xl border border-indigo-500/30 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create New Election</h3>
              <p className="text-xs text-slate-400">Deploys a new election state to the smart contract.</p>
            </div>
          </div>

          <form onSubmit={handleCreateElection} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Election Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. UET Student Council 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Election Purpose / Description *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe the governance purpose and rules for this election..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition"
            >
              Sign & Create Election
            </button>
          </form>
        </div>

        {/* Form 2: Add Candidate */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Register Candidate</h3>
              <p className="text-xs text-slate-400">
                Add candidates to an election before voting commences.
              </p>
            </div>
          </div>

          <form onSubmit={handleAddCandidate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Election *
              </label>
              <select
                value={selectedElectionId}
                onChange={(e) => setSelectedElectionIdForm(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {elections.map((el) => (
                  <option key={el.id} value={el.id}>
                    #{el.id}: {el.title} ({el.status === 0 ? 'Upcoming' : el.status === 1 ? 'Active' : 'Ended'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Candidate Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ayesha Khan"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Candidate Bio / Platform Statement *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Key goals, background, and proposed reforms..."
                value={candidateDesc}
                onChange={(e) => setCandidateDesc(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/30 transition"
            >
              Sign & Register Candidate
            </button>
          </form>
        </div>

      </div>

      {/* Managed Elections Table */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white">Managed Elections Overview</h3>

        {elections.length === 0 ? (
          <p className="text-xs text-slate-400">No elections found on this contract.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">Title</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Candidates</th>
                  <th className="pb-3 font-semibold">Total Votes</th>
                  <th className="pb-3 font-semibold">End Time</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {elections.map((el) => (
                  <tr key={el.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 font-mono font-bold text-slate-200">#{el.id}</td>
                    <td className="py-3 font-medium text-white max-w-xs truncate">{el.title}</td>
                    <td className="py-3">
                      <StatusBadge status={el.status} />
                    </td>
                    <td className="py-3 font-mono text-slate-300">{el.candidateCount}</td>
                    <td className="py-3 font-mono text-indigo-400 font-semibold">{el.totalVotes}</td>
                    <td className="py-3 font-mono text-slate-400">{formatDateTime(el.endTime)}</td>
                    <td className="py-3 text-right">
                      {el.status !== 2 && (
                        <button
                          onClick={() => handleEndElection(el.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-semibold text-[11px] transition"
                        >
                          End Early
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        state={txState}
        txHash={txHash}
        errorMessage={txError}
        onClose={() => setTxState('IDLE')}
      />

    </div>
  );
}
