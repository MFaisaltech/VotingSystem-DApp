import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Layers, 
  Users, 
  Vote, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Calendar
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { getAllElections, getUserVoteInfo } from '../services/contractService';
import { formatDateTime } from '../utils/formatters';
import SkeletonCard from '../components/SkeletonCard';
import StatusBadge from '../components/StatusBadge';
import CountdownTimer from '../components/CountdownTimer';

export default function ElectionsPage({ setActivePage, setSelectedElectionId }) {
  const { account, provider, getReadOnlyProvider } = useWeb3();

  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'UPCOMING' | 'ENDED'
  const [userVotedMap, setUserVotedMap] = useState({});

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const p = provider || getReadOnlyProvider();
        const list = await getAllElections(p);
        setElections(list);

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
        console.error("Failed to fetch elections:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, [account, provider]);

  // Filter and Search logic
  const filteredElections = elections.filter((el) => {
    const matchesSearch = 
      el.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      el.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ACTIVE') return el.status === 1;
    if (statusFilter === 'UPCOMING') return el.status === 0;
    if (statusFilter === 'ENDED') return el.status === 2;
    return true; // 'ALL'
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Elections Directory</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse and participate in verified on-chain elections.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl glass-card border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search elections by title or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'UPCOMING', label: 'Upcoming' },
            { id: 'ENDED', label: 'Concluded' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Elections Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard count={6} />
        </div>
      ) : filteredElections.length === 0 ? (
        <div className="p-16 text-center glass-card rounded-2xl border border-slate-800 max-w-lg mx-auto">
          <Layers className="w-12 h-12 mx-auto text-slate-500 mb-3" />
          <h3 className="text-base font-bold text-slate-300">No Elections Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery
              ? `No election matched your query "${searchQuery}". Try a different search term.`
              : 'No elections match the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredElections.map((el) => {
            const hasVoted = Boolean(userVotedMap[el.id]);

            return (
              <div
                key={el.id}
                className="glass-card-hover p-6 rounded-2xl border border-slate-800/90 flex flex-col justify-between"
              >
                <div>
                  {/* Top bar: ID and Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                      ID #{el.id}
                    </span>
                    <StatusBadge status={el.status} />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white mb-2 leading-snug hover:text-indigo-300 transition">
                    {el.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                    {el.description}
                  </p>
                </div>

                {/* Timing & Stats Section */}
                <div className="pt-4 border-t border-slate-800/80 space-y-3.5">
                  
                  {/* Countdown Timer or Schedule */}
                  {el.status === 1 ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Ends in:</span>
                      <CountdownTimer targetTimestamp={el.endTime} />
                    </div>
                  ) : el.status === 0 ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Starts in:</span>
                      <CountdownTimer targetTimestamp={el.startTime} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Ended on:</span>
                      <span className="font-mono text-slate-300">{formatDateTime(el.endTime)}</span>
                    </div>
                  )}

                  {/* Candidates & Votes Bar */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{el.candidateCount} Candidates</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Vote className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-medium text-slate-200">{el.totalVotes} Votes Cast</span>
                    </div>
                  </div>

                  {/* User Voted Badge */}
                  {hasVoted && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-400">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>You voted in this election</span>
                      </div>
                      <span className="font-mono font-semibold">Candidate #{userVotedMap[el.id]}</span>
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedElectionId(el.id);
                        setActivePage('electionDetail');
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
                    >
                      <span>{el.status === 1 ? (hasVoted ? 'View Candidates' : 'Cast Vote') : 'View Election'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedElectionId(el.id);
                        setActivePage('results');
                      }}
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white font-semibold text-xs transition"
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
  );
}
