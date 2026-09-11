/**
 * Translates smart contract revert reasons, custom errors, and ethers/MetaMask
 * exceptions into friendly, actionable user messages.
 */
export function parseContractError(error) {
  console.groupCollapsed("Contract Interaction Diagnostic");
  console.error(error);
  console.groupEnd();

  if (!error) return "An unknown error occurred.";

  const msg = error.message || error.reason || String(error);
  const data = error.data || error.error?.data;

  // User canceled in wallet (MetaMask code 4001 or ethers ACTION_REJECTED)
  if (
    error.code === 4001 ||
    error.code === 'ACTION_REJECTED' ||
    msg.includes('user rejected') ||
    msg.includes('rejected transaction') ||
    msg.includes('User denied')
  ) {
    return "Transaction was canceled by your wallet.";
  }

  // Insufficient funds for gas
  if (error.code === 'INSUFFICIENT_FUNDS' || msg.includes('insufficient funds')) {
    return "Insufficient ETH to cover gas fees. Please acquire test ETH.";
  }

  // Custom Contract Revert Errors
  if (msg.includes('AlreadyVoted') || (data && (data.includes('0x04f9da63') || data.includes('0x4e23078a')))) {
    return "You have already voted in this election. Each wallet is restricted to one vote.";
  }
  if (msg.includes('ElectionNotStarted')) {
    return "Voting has not yet commenced for this election.";
  }
  if (msg.includes('ElectionAlreadyEnded')) {
    return "Voting for this election has already concluded.";
  }
  if (msg.includes('CandidateDoesNotExist')) {
    return "The selected candidate does not exist in this election.";
  }
  if (msg.includes('ElectionAlreadyStarted')) {
    return "Candidates cannot be added after the election has started.";
  }
  if (msg.includes('ElectionDoesNotExist')) {
    return "The specified election was not found on the blockchain.";
  }
  if (msg.includes('InvalidElectionTimes')) {
    return "Invalid election schedule. Start time must be in the future, and end time must follow start time.";
  }
  if (msg.includes('EmptyStringNotAllowed') || msg.includes('InvalidCandidateName')) {
    return "Title, description, and candidate names cannot be empty.";
  }
  if (msg.includes('OwnableUnauthorizedAccount') || msg.includes('caller is not the owner')) {
    return "Access restricted: Only the contract administrator can perform this action.";
  }
  if (msg.includes('NoCandidatesInElection')) {
    return "No candidates registered for this election.";
  }

  // Reentrancy
  if (msg.includes('ReentrancyGuardReentrantCall')) {
    return "Concurrent transaction detected. Please wait for current transaction to finish.";
  }

  // Network or RPC provider errors
  if (msg.includes('Failed to fetch') || msg.includes('could not detect network')) {
    return "Unable to connect to blockchain node. Please check your local Hardhat node or network connection.";
  }

  return "Transaction reverted by the smart contract. Please check election timing and eligibility.";
}
