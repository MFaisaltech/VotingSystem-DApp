import { ethers } from 'ethers';
import contractAddressData from '../contracts/contractAddress.json';
import contractArtifact from '../contracts/DecentralizedVoting.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || contractAddressData.address;

/**
 * Returns an ethers Contract instance attached to either a Signer or Provider.
 */
export function getVotingContract(signerOrProvider) {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address is not configured. Please deploy the contract first.");
  }
  return new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, signerOrProvider);
}

/**
 * Format raw Solidity Election struct into JavaScript object
 */
export function formatElection(raw, liveStatus) {
  return {
    id: Number(raw.id),
    title: raw.title,
    description: raw.description,
    startTime: Number(raw.startTime),
    endTime: Number(raw.endTime),
    endedManually: Boolean(raw.endedManually),
    totalVotes: Number(raw.totalVotes),
    candidateCount: Number(raw.candidateCount),
    exists: Boolean(raw.exists),
    status: liveStatus !== undefined ? Number(liveStatus) : computeLocalStatus(raw),
  };
}

/**
 * Fallback status calculator
 * 0: UPCOMING, 1: ACTIVE, 2: ENDED
 */
function computeLocalStatus(raw) {
  const now = Math.floor(Date.now() / 1000);
  if (raw.endedManually || now > Number(raw.endTime)) return 2; // ENDED
  if (now < Number(raw.startTime)) return 0; // UPCOMING
  return 1; // ACTIVE
}

/**
 * Format raw Candidate struct
 */
export function formatCandidate(raw) {
  return {
    id: Number(raw.id),
    name: raw.name,
    description: raw.description,
    voteCount: Number(raw.voteCount),
  };
}

/**
 * Fetch all elections directly from on-chain smart contract
 */
export async function getAllElections(provider) {
  const contract = getVotingContract(provider);
  const rawElections = await contract.getAllElections();

  const elections = await Promise.all(
    rawElections.map(async (raw) => {
      const id = Number(raw.id);
      let status;
      try {
        status = await contract.getElectionStatus(id);
      } catch {
        status = computeLocalStatus(raw);
      }
      return formatElection(raw, status);
    })
  );

  return elections;
}

/**
 * Fetch single election by ID from smart contract
 */
export async function getElectionById(electionId, provider) {
  const contract = getVotingContract(provider);
  const raw = await contract.getElection(electionId);
  const status = await contract.getElectionStatus(electionId);
  return formatElection(raw, status);
}

/**
 * Fetch candidates for an election directly from smart contract
 */
export async function getCandidates(electionId, provider) {
  const contract = getVotingContract(provider);
  const rawCandidates = await contract.getCandidates(electionId);
  return rawCandidates.map(formatCandidate);
}

/**
 * Check if an address has voted and get their choice
 */
export async function getUserVoteInfo(electionId, voterAddress, provider) {
  if (!voterAddress) return { hasVoted: false, candidateId: 0 };
  const contract = getVotingContract(provider);
  const hasVoted = await contract.hasUserVoted(electionId, voterAddress);
  let candidateId = 0;
  if (hasVoted) {
    try {
      const choice = await contract.getUserVote(electionId, voterAddress);
      candidateId = Number(choice);
    } catch (e) {
      console.warn("Could not retrieve choice:", e);
    }
  }
  return { hasVoted, candidateId };
}

/**
 * Fetch winner/leader information from contract
 */
export async function getWinnerInfo(electionId, provider) {
  const contract = getVotingContract(provider);
  try {
    const [winnerRaw, isTie, winningVoteCount] = await contract.getWinner(electionId);
    return {
      winner: formatCandidate(winnerRaw),
      isTie: Boolean(isTie),
      winningVoteCount: Number(winningVoteCount),
    };
  } catch (err) {
    return { winner: null, isTie: false, winningVoteCount: 0 };
  }
}

/**
 * Cast vote transaction
 */
export async function castVoteTx(electionId, candidateId, signer) {
  const contract = getVotingContract(signer);
  const tx = await contract.vote(electionId, candidateId);
  const receipt = await tx.wait();
  return { tx, receipt };
}

/**
 * Create election transaction (Admin only)
 */
export async function createElectionTx(title, description, startTime, endTime, signer) {
  const contract = getVotingContract(signer);
  const tx = await contract.createElection(title, description, startTime, endTime);
  const receipt = await tx.wait();
  return { tx, receipt };
}

/**
 * Add candidate transaction (Admin only)
 */
export async function addCandidateTx(electionId, name, description, signer) {
  const contract = getVotingContract(signer);
  const tx = await contract.addCandidate(electionId, name, description);
  const receipt = await tx.wait();
  return { tx, receipt };
}

/**
 * End election transaction (Admin only)
 */
export async function endElectionTx(electionId, signer) {
  const contract = getVotingContract(signer);
  const tx = await contract.endElection(electionId);
  const receipt = await tx.wait();
  return { tx, receipt };
}
