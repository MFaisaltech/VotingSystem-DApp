# Decentralized Voting System (DApp)

> **Decentralized Voting. Transparent Decisions.**  
> A production-grade Web3 voting platform powered by Solidity smart contracts on the Ethereum blockchain, paired with a modern React, Vite, and Tailwind CSS frontend.

![Decentralized Voting DApp](https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80)

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Smart Contract Deep Dive](#smart-contract-deep-dive)
6. [Security & Access Control](#security--access-control)
7. [Project Structure](#project-structure)
8. [Quick Start & Setup Guide](#quick-start--setup-guide)
9. [Smart Contract Testing](#smart-contract-testing)
10. [Local Blockchain & Seeding](#local-blockchain--seeding)
11. [Frontend Walkthrough](#frontend-walkthrough)
12. [Environment Variables](#environment-variables)
13. [Future Roadmap](#future-roadmap)

---

## Project Overview

Traditional electronic and paper voting systems rely on centralized databases and trusted authorities, leaving them vulnerable to tampering, retroactive alteration, and administrative opacity.

The **Decentralized Voting System (DApp)** establishes the blockchain as the immutable, single source of truth for:
* **Elections lifecycle**: Title, description, schedule, and state transitions.
* **Candidates**: Candidate profiles, manifestos, and real-time vote tally.
* **Voter Eligibility & Status**: Enforces strict **one-wallet, one-vote** rules on-chain.
* **Result Calculation**: Winner calculation and tie detection computed deterministically on-chain without trusting client-side scripts.

---

## Key Features

- ⛓️ **100% On-Chain Truth**: No centralized databases (no MongoDB, Firebase, Supabase, or localStorage). All ballot data resides permanently on Ethereum.
- 🛡️ **Cryptographic One-Wallet One-Vote**: Enforced at the smart contract level (`mapping(uint256 => mapping(address => bool)) hasVoted`). Double voting is mathematically blocked.
- ⏱️ **Time-Locked Elections**: Smart contract enforces that votes can only be cast within designated `startTime` and `endTime` windows.
- 👑 **Role-Based Access Control**: Powered by OpenZeppelin's `Ownable`. Only the verified contract administrator can create elections, register candidates, and manage election lifecycles.
- 🏆 **On-Chain Winner Resolution**: Real-time evaluation of leaders, tied positions, and winning tallies directly via Solidity view functions.
- 🎨 **Modern Web3 Interface**: Built with Tailwind CSS, dark aesthetic, glassmorphism cards, shimmer skeleton loaders, live countdown timers, and confirmation dialogs.
- 🔔 **Transaction Lifecycle Tracking**: Detailed feedback states: `Wallet Confirmation` → `Block Mining` → `Confirmed On-Chain` (with transaction hash and explorer links).
- 💬 **Human-Friendly Error Translation**: Custom smart contract revert reasons (e.g. `AlreadyVoted`, `ElectionNotStarted`, `ElectionAlreadyEnded`) are translated into clear, actionable notifications.

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Web3 User / Browser                  │
│       MetaMask / Browser EIP-1193 Injected Wallet      │
└───────────────────────────┬────────────────────────────┘
                            │ (JSON-RPC Signer / Provider)
                            ▼
┌────────────────────────────────────────────────────────┐
│              Frontend Application (React + Vite)       │
│  - Web3Context (Account, Network, Chain Detection)     │
│  - ContractService (Direct ethers.js v6 Calls)         │
│  - UI Views: Landing, Dashboard, Elections, Results    │
└───────────────────────────┬────────────────────────────┘
                            │ (EVM Transactions & View Calls)
                            ▼
┌────────────────────────────────────────────────────────┐
│       Ethereum Virtual Machine (Solidity 0.8.24)       │
│               DecentralizedVoting.sol                  │
│  ├── OpenZeppelin Ownable & ReentrancyGuard            │
│  ├── State: elections[], candidates[][], hasVoted[][]  │
│  └── Logic: createElection, addCandidate, vote, winner │
└────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Smart Contract Backend
* **Solidity `^0.8.24`**: Gas-optimized smart contract language.
* **OpenZeppelin Contracts `v5.0.2`**: Industry-standard `Ownable` and `ReentrancyGuard`.
* **Hardhat `v2.22.x`**: Development, compilation, testing, and deployment framework.
* **Mocha & Chai**: Comprehensive automated testing suite.

### Frontend Application
* **React `18.3`**: Modern component architecture with hooks and context API.
* **Vite `5.4`**: Next-generation lightning-fast frontend tooling.
* **Tailwind CSS `3.4`**: Custom dark Web3 styling with glassmorphism and subtle neon accents.
* **ethers.js `v6.13`**: Direct interaction with Ethereum nodes and contracts.
* **Lucide React**: Crisp iconography for Web3 status and navigational elements.
* **Canvas-Confetti**: Visual celebration on verified ballot submission.

---

## Smart Contract Deep Dive

Contract location: `contracts/contracts/DecentralizedVoting.sol`

### State Structures & Mappings
```solidity
enum ElectionStatus { UPCOMING, ACTIVE, ENDED }

struct Candidate {
    uint256 id;
    string name;
    string description;
    uint256 voteCount;
}

struct Election {
    uint256 id;
    string title;
    string description;
    uint256 startTime;
    uint256 endTime;
    bool endedManually;
    uint256 totalVotes;
    uint256 candidateCount;
    bool exists;
}

// 1-wallet-1-vote mapping
mapping(uint256 => mapping(address => bool)) public hasVoted;
```

### Custom Errors for Gas Efficiency
* `ElectionDoesNotExist(uint256 electionId)`
* `ElectionAlreadyStarted()`
* `ElectionNotStarted()`
* `ElectionAlreadyEnded()`
* `VotingNotActive()`
* `AlreadyVoted(uint256 electionId, address voter)`
* `CandidateDoesNotExist(uint256 electionId, uint256 candidateId)`
* `InvalidCandidateName()`
* `InvalidElectionTimes()`
* `EmptyStringNotAllowed()`

### Events Emitted
* `ElectionCreated(uint256 indexed electionId, string title, uint256 startTime, uint256 endTime, address indexed creator)`
* `CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name)`
* `VoteCast(uint256 indexed electionId, uint256 indexed candidateId, address indexed voter)`
* `ElectionEnded(uint256 indexed electionId, address indexed endedBy, uint256 totalVotes)`

---

## Security & Access Control

1. **Reentrancy Protection**: Critical state mutations in `vote()` are guarded with OpenZeppelin's `nonReentrant` modifier.
2. **Strict Single Vote Enforceability**: The check `if (hasVoted[_electionId][msg.sender]) revert AlreadyVoted(...)` runs before state updates, making double voting impossible.
3. **Immutability of Active Elections**: Once an election reaches `block.timestamp >= election.startTime`, no further candidates can be injected (`revert ElectionAlreadyStarted()`).
4. **Time Window Validation**: Bounded voting periods prevent frontrunning and late ballot stuffing.
5. **No Private Keys Exposed**: The frontend contains zero private keys or secrets; all transaction signing is delegated to the user's browser wallet.

---

## Project Structure

```
decentralized-voting/
├── contracts/
│   ├── contracts/
│   │   └── DecentralizedVoting.sol    # Core Solidity contract
│   ├── scripts/
│   │   ├── deploy.js                  # Deployment script (exports ABI/address)
│   │   └── seed.js                    # Demo seed script (elections, candidates, votes)
│   ├── test/
│   │   └── DecentralizedVoting.test.js # 21 comprehensive Mocha/Chai tests
│   ├── hardhat.config.cjs             # Hardhat network & compiler configuration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Network switch, wallet connection & dropdown
│   │   │   ├── Footer.jsx             # Contract address & verification badge
│   │   │   ├── StatusBadge.jsx        # Live/Upcoming/Concluded indicators
│   │   │   ├── CountdownTimer.jsx     # Dynamic countdown clock
│   │   │   ├── VoteConfirmationModal.jsx # Mandatory pre-vote warning dialog
│   │   │   ├── TransactionModal.jsx   # Wallet signing & block mining tracker
│   │   │   ├── SkeletonCard.jsx       # Shimmer loading placeholders
│   │   │   └── Toast.jsx              # User notification alerts
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx        # Hero section & governance value proposition
│   │   │   ├── DashboardPage.jsx      # Metrics overview & user participation status
│   │   │   ├── ElectionsPage.jsx      # Directory with search & category filters
│   │   │   ├── ElectionDetailPage.jsx # Candidate manifestos & voting interface
│   │   │   ├── ResultsPage.jsx        # Verified on-chain results & distribution bars
│   │   │   └── AdminPage.jsx          # Election creation & candidate registration
│   │   ├── context/
│   │   │   └── Web3Context.jsx        # MetaMask provider & account state
│   │   ├── services/
│   │   │   └── contractService.js     # Blockchain abstraction layer
│   │   ├── utils/
│   │   │   ├── formatters.js          # Address shortening & date utilities
│   │   │   └── errorParser.js         # EVM revert error translator
│   │   ├── contracts/                 # Deployed ABI and contract address
│   │   ├── App.jsx                    # Root view controller
│   │   ├── main.jsx                   # React DOM mount
│   │   └── index.css                  # Custom styling & scrollbars
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## Quick Start & Setup Guide

### Prerequisites
* **Node.js**: v18 or v20+
* **npm**: v9+
* **MetaMask** browser extension

---

### Step 1: Install Dependencies

```bash
# Install smart contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2: Compile Contracts & Run Tests

```bash
cd contracts
npx hardhat compile
npx hardhat test
```
*Expected result: All 21 tests pass with zero errors.*

---

### Step 3: Start Local Blockchain Node

In a dedicated terminal window:
```bash
cd contracts
npx hardhat node
```
This spawns a local Ethereum RPC node at `http://127.0.0.1:8545` with Chain ID `31337` and 20 pre-funded test accounts (10,000 ETH each).

---

### Step 4: Deploy & Seed Demo Data

In a second terminal window:
```bash
cd contracts
npx hardhat run scripts/seed.js --network localhost
```
This script:
1. Deploys `DecentralizedVoting.sol` to the local network.
2. Automatically copies the ABI and deployed address to `frontend/src/contracts/`.
3. Seeds 3 realistic demo elections:
   * **Election 1: "UET Student Council 2026"** (Active election with 3 candidates: *Ayesha Khan*, *Bilal Tariq*, *Zainab Fatima*).
   * **Election 2: "Web3 Innovation Guild Lead"** (Active election with candidate votes cast on-chain).
   * **Election 3: "Campus AI Safety Board 2025"** (Concluded election demonstrating certified results).

---

### Step 5: Start the Frontend Application

```bash
cd frontend
npm run dev
```
Open your browser and navigate to:
**`http://localhost:5173`**

---

### Step 6: Connect MetaMask to Local Hardhat Node

1. In MetaMask, open **Settings → Networks → Add Network Manually**:
   * **Network Name**: `Hardhat Localhost`
   * **RPC URL**: `http://127.0.0.1:8545`
   * **Chain ID**: `31337`
   * **Currency Symbol**: `ETH`
2. Import one of Hardhat's test private keys:
   * **Deployer / Admin (Account #0)**:  
     `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   * **Voter 1 (Account #1)**:  
     `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   * **Voter 2 (Account #2)**:  
     `0x5de4111afa1a4b94908f83103eb2173f1a097720d1aa5588d000b471249b56f0`
3. Click **"Connect Wallet"** in the top navigation bar.

---

## Smart Contract Testing

The test suite thoroughly covers both success flows and revert scenarios:

| Category | Test Case | Status |
| :--- | :--- | :---: |
| **Deployment** | Deployer set as contract owner & initial count 0 | ✅ Passing |
| **Elections** | Owner creates election with valid schedule & emits event | ✅ Passing |
| **Elections** | Non-owner cannot create elections (`OwnableUnauthorizedAccount`) | ✅ Passing |
| **Elections** | Rejects empty titles and descriptions (`EmptyStringNotAllowed`) | ✅ Passing |
| **Elections** | Rejects invalid timestamps (past start or end <= start) | ✅ Passing |
| **Candidates** | Owner registers candidates before election starts | ✅ Passing |
| **Candidates** | Non-owner cannot register candidates | ✅ Passing |
| **Candidates** | Rejects candidate registration after election start (`ElectionAlreadyStarted`) | ✅ Passing |
| **Voting** | Rejects vote before election start (`ElectionNotStarted`) | ✅ Passing |
| **Voting** | Valid vote increments tally and records voter receipt | ✅ Passing |
| **Voting** | Prevents double voting from same wallet (`AlreadyVoted`) | ✅ Passing |
| **Voting** | Rejects non-existent candidate ID (`CandidateDoesNotExist`) | ✅ Passing |
| **Voting** | Rejects voting after election end time (`ElectionAlreadyEnded`) | ✅ Passing |
| **Results** | Computes sole on-chain winner correctly | ✅ Passing |
| **Results** | Detects tied candidate tallies on-chain | ✅ Passing |
| **Results** | Validates status transitions (`UPCOMING` → `ACTIVE` → `ENDED`) | ✅ Passing |
| **Admin** | Allows owner to conclude election manually & emits `ElectionEnded` | ✅ Passing |

To run the test suite:
```bash
cd contracts
npx hardhat test
```

---

## Environment Variables

The frontend reads non-secret configuration variables:

```env
# Frontend environment variables (.env / .env.example)
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_CHAIN_ID=31337
VITE_RPC_URL=http://127.0.0.1:8545
```

---

## Future Roadmap

- 🛡️ **Zero-Knowledge Proofs (zk-SNARKs)**: Anonymous voting preserving voter privacy while mathematically proving eligibility.
- 🪙 **Quadratic Voting & Token-Weighted Governance**: ERC-20 / ERC-721 token-weighted voting power for decentralized DAOs.
- 🌐 **Multi-Chain Deployment**: Expand deployment to Ethereum L2s (Arbitrum, Optimism, Base) for sub-cent gas fees.
- 📱 **Decentralized Storage (IPFS/Arweave)**: Store detailed candidate manifestos, multimedia debates, and PDF attachments via decentralized storage hashes.

---

## License
MIT License. Free for open-source use, research, and portfolio demonstration.
