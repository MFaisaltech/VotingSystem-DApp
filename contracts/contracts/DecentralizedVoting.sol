// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DecentralizedVoting
 * @notice A secure, transparent, decentralized election and voting system.
 *         Ensures 1-wallet-1-vote on-chain, verifiable vote tallying, and tamper-resistant election lifecycles.
 */
contract DecentralizedVoting is Ownable, ReentrancyGuard {

    // --- ENUMS & STRUCTS ---

    enum ElectionStatus {
        UPCOMING,
        ACTIVE,
        ENDED
    }

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

    // --- STATE VARIABLES ---

    uint256 public electionCount;

    // electionId => Election details
    mapping(uint256 => Election) public elections;

    // electionId => candidateId => Candidate details
    mapping(uint256 => mapping(uint256 => Candidate)) public candidates;

    // electionId => voterAddress => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // electionId => voterAddress => candidateId (voter choice record)
    mapping(uint256 => mapping(address => uint256)) public voterChoice;

    // --- CUSTOM ERRORS ---

    error ElectionDoesNotExist(uint256 electionId);
    error ElectionAlreadyStarted();
    error ElectionNotStarted();
    error ElectionAlreadyEnded();
    error VotingNotActive();
    error AlreadyVoted(uint256 electionId, address voter);
    error CandidateDoesNotExist(uint256 electionId, uint256 candidateId);
    error InvalidCandidateName();
    error InvalidElectionTimes();
    error EmptyStringNotAllowed();
    error NoCandidatesInElection();

    // --- EVENTS ---

    event ElectionCreated(
        uint256 indexed electionId,
        string title,
        uint256 startTime,
        uint256 endTime,
        address indexed creator
    );

    event CandidateAdded(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        string name
    );

    event VoteCast(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        address indexed voter
    );

    event ElectionEnded(
        uint256 indexed electionId,
        address indexed endedBy,
        uint256 totalVotes
    );

    // --- CONSTRUCTOR ---

    constructor() Ownable(msg.sender) {}

    // --- MODIFIERS ---

    modifier electionExists(uint256 _electionId) {
        if (!elections[_electionId].exists) {
            revert ElectionDoesNotExist(_electionId);
        }
        _;
    }

    // --- CORE FUNCTIONS ---

    /**
     * @notice Create a new election with title, description, and time window.
     * @param _title Title of the election
     * @param _description Description / details of the election
     * @param _startTime Timestamp when voting begins
     * @param _endTime Timestamp when voting ends
     * @return electionId The newly created election's ID
     */
    function createElection(
        string calldata _title,
        string calldata _description,
        uint256 _startTime,
        uint256 _endTime
    ) external onlyOwner returns (uint256) {
        if (bytes(_title).length == 0 || bytes(_description).length == 0) {
            revert EmptyStringNotAllowed();
        }
        if (_startTime < block.timestamp || _endTime <= _startTime) {
            revert InvalidElectionTimes();
        }

        electionCount++;
        uint256 newId = electionCount;

        elections[newId] = Election({
            id: newId,
            title: _title,
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            endedManually: false,
            totalVotes: 0,
            candidateCount: 0,
            exists: true
        });

        emit ElectionCreated(newId, _title, _startTime, _endTime, msg.sender);
        return newId;
    }

    /**
     * @notice Add a candidate to an election. Can only be done before election voting starts.
     * @param _electionId ID of the election
     * @param _name Candidate's full name
     * @param _description Candidate's bio / manifesto
     */
    function addCandidate(
        uint256 _electionId,
        string calldata _name,
        string calldata _description
    ) external onlyOwner electionExists(_electionId) {
        Election storage election = elections[_electionId];

        if (election.endedManually || block.timestamp >= election.startTime) {
            revert ElectionAlreadyStarted();
        }
        if (bytes(_name).length == 0) {
            revert InvalidCandidateName();
        }

        election.candidateCount++;
        uint256 candidateId = election.candidateCount;

        candidates[_electionId][candidateId] = Candidate({
            id: candidateId,
            name: _name,
            description: _description,
            voteCount: 0
        });

        emit CandidateAdded(_electionId, candidateId, _name);
    }

    /**
     * @notice Cast a single vote for a candidate in an active election.
     * @dev Protected by ReentrancyGuard and strictly enforces 1-wallet-1-vote.
     * @param _electionId ID of the election
     * @param _candidateId 1-indexed ID of the candidate
     */
    function vote(
        uint256 _electionId,
        uint256 _candidateId
    ) external nonReentrant electionExists(_electionId) {
        Election storage election = elections[_electionId];

        // Check timing
        if (election.endedManually || block.timestamp > election.endTime) {
            revert ElectionAlreadyEnded();
        }
        if (block.timestamp < election.startTime) {
            revert ElectionNotStarted();
        }

        // Check candidate validity
        if (_candidateId == 0 || _candidateId > election.candidateCount) {
            revert CandidateDoesNotExist(_electionId, _candidateId);
        }

        // Check if voter has already voted
        if (hasVoted[_electionId][msg.sender]) {
            revert AlreadyVoted(_electionId, msg.sender);
        }

        // Update state
        hasVoted[_electionId][msg.sender] = true;
        voterChoice[_electionId][msg.sender] = _candidateId;
        candidates[_electionId][_candidateId].voteCount++;
        election.totalVotes++;

        emit VoteCast(_electionId, _candidateId, msg.sender);
    }

    /**
     * @notice Manually conclude an election ahead of time.
     * @param _electionId ID of the election
     */
    function endElection(
        uint256 _electionId
    ) external onlyOwner electionExists(_electionId) {
        Election storage election = elections[_electionId];
        if (election.endedManually || block.timestamp > election.endTime) {
            revert ElectionAlreadyEnded();
        }

        election.endedManually = true;
        emit ElectionEnded(_electionId, msg.sender, election.totalVotes);
    }

    // --- VIEW / GETTER FUNCTIONS ---

    /**
     * @notice Returns the live computed status of an election.
     * @param _electionId ID of the election
     */
    function getElectionStatus(
        uint256 _electionId
    ) public view electionExists(_electionId) returns (ElectionStatus) {
        Election storage election = elections[_electionId];
        if (election.endedManually || block.timestamp > election.endTime) {
            return ElectionStatus.ENDED;
        }
        if (block.timestamp < election.startTime) {
            return ElectionStatus.UPCOMING;
        }
        return ElectionStatus.ACTIVE;
    }

    /**
     * @notice Get election details.
     * @param _electionId ID of the election
     */
    function getElection(
        uint256 _electionId
    ) external view electionExists(_electionId) returns (Election memory) {
        return elections[_electionId];
    }

    /**
     * @notice Get all elections in one call (ideal for frontend dashboard).
     */
    function getAllElections() external view returns (Election[] memory) {
        Election[] memory allElections = new Election[](electionCount);
        for (uint256 i = 1; i <= electionCount; i++) {
            allElections[i - 1] = elections[i];
        }
        return allElections;
    }

    /**
     * @notice Get all candidates for a given election.
     * @param _electionId ID of the election
     */
    function getCandidates(
        uint256 _electionId
    ) external view electionExists(_electionId) returns (Candidate[] memory) {
        uint256 count = elections[_electionId].candidateCount;
        Candidate[] memory candidateList = new Candidate[](count);
        for (uint256 i = 1; i <= count; i++) {
            candidateList[i - 1] = candidates[_electionId][i];
        }
        return candidateList;
    }

    /**
     * @notice Check whether an address has voted in an election.
     * @param _electionId ID of the election
     * @param _voter Address to inspect
     */
    function hasUserVoted(
        uint256 _electionId,
        address _voter
    ) external view electionExists(_electionId) returns (bool) {
        return hasVoted[_electionId][_voter];
    }

    /**
     * @notice Get candidate ID selected by a voter in an election.
     * @param _electionId ID of the election
     * @param _voter Address to inspect
     */
    function getUserVote(
        uint256 _electionId,
        address _voter
    ) external view electionExists(_electionId) returns (uint256) {
        return voterChoice[_electionId][_voter];
    }

    /**
     * @notice Determine the current leader or winner of an election.
     * @dev Handled completely on-chain without frontend calculation.
     * @param _electionId ID of the election
     * @return winner The leading candidate
     * @return isTie True if two or more top candidates share the same non-zero vote count
     * @return winningVoteCount Number of votes the leader has
     */
    function getWinner(
        uint256 _electionId
    )
        external
        view
        electionExists(_electionId)
        returns (
            Candidate memory winner,
            bool isTie,
            uint256 winningVoteCount
        )
    {
        uint256 count = elections[_electionId].candidateCount;
        if (count == 0) {
            revert NoCandidatesInElection();
        }

        uint256 highestVotes = 0;
        uint256 winningCandidateId = 1;
        uint256 leaderCount = 0;

        for (uint256 i = 1; i <= count; i++) {
            uint256 votes = candidates[_electionId][i].voteCount;
            if (votes > highestVotes) {
                highestVotes = votes;
                winningCandidateId = i;
                leaderCount = 1;
            } else if (votes == highestVotes && votes > 0) {
                leaderCount++;
            }
        }

        winner = candidates[_electionId][winningCandidateId];
        winningVoteCount = highestVotes;
        isTie = (leaderCount > 1);

        return (winner, isTie, winningVoteCount);
    }
}
